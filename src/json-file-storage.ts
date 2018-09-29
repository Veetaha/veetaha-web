import * as Fsextra   from 'fs-extra';
import * as Types from './types';
interface JsonJsonFileStorage<T extends Types.Identifiable> {
    nextId: number;
    items: T[];
}
type JsonReviver<T, TJsonRepr> = (jsonValue: TJsonRepr) => T;
/**
 * Represents a JSON file, that contains a server object for storing Types.Identifiable objects.
 * @param T           Typescript type that must implement Types.Identifiable
 *                    (i.e. contain {id: number} property). Objects of this type are
 *                    stored in a JSON file.
 * @param TJsonRepr   JSON type representation of T.
 */
export class JsonFileStorage<T extends Types.Identifiable, TJsonRepr extends Types.Identifiable> {
    private             nextId = 1;
    public  reviveJsonEntity: JsonReviver<T, TJsonRepr>;
    private readonly  filePath: string;
    private readonly storageTD: Types.TypeDescription;
//------------------------------------------------------------//
    /**
     * Reads file and interprets its content as a JSON object. Checks that it conforms to
     * the given type description (TD).
     * @type  T             Typescript type return value is treated as,
     *                      if this function didn't throw.
     * @type  TJsonRepr     JSON representation of type T.
     * @param filePath      String with the json target file path.
     * @param jsonTypeDescr Type description for JSON value representation.
     * @param jsonReviver   Function JsonReviver<T, TJsonRepr> called on a parsed json value
     *                      in order to convert it from TJsonRepr to T.
     *                      from type TJsonRepr to type T.
     *
     * @throws Error If actual JSON value doesn't conform to the given TD,
     *               if failed to read required file,
     *               if failed to parse resulting JSON string.
     */
    static async readFromJsonFile<T, TJsonRepr>(
        filePath: string,
        jsonTypeDescr: Types.TypeDescription,
        jsonReviver: JsonReviver<T, TJsonRepr>
    ): Promise<T> {
        const jsonString = (await Fsextra.readFile(filePath)).toString();  // throws
        const jsonObj = JSON.parse(jsonString);
        if (Types.conforms<TJsonRepr>(jsonObj, jsonTypeDescr)) {
            return jsonReviver(jsonObj);
        }
        throw new Error(
            `Actual json data doesn't conform to the required type: ${jsonObj}`
        );
    }


    /**
     * Creates new instance of JsonFileStorage, but doesn't initialize the file at physical disk.
     * @param itemsTD     Type description the resulting JSON value must conform to. (takes ownership)
     * @param filePath    String with the JSON target file path.
     * @param jsonReviver Function invoked to revive stored objects when using JSON.parse()
     * @throws Error If actual JSON value doesn't conform to the given TD,
     *               if failed to read required file,
     *               if failed to parse resulting JSON string.
     */
    constructor(
        itemsTD:     Types.TypeDescription,
        filePath:    string,
        jsonReviver: JsonReviver<T, TJsonRepr>
    ) {
        this.storageTD = {
            nextId: 'number',
            items: [itemsTD]
        };
        this.filePath         = filePath;
        this.reviveJsonEntity = jsonReviver;
    }

    /**
     * Creates a new file for this Storage or reads the content of an existing file to initialize
     * its internal data (e.g. next id number).
     * @throws Error If failed to write to the required file.
     * If failed to read or parse required JSON file, creates new file, or rewrites existing one.
     * If JSON file doesn't exist, it creates a new one.
     *
     */
    async initialize() {
        try {
            this.nextId = (await this.readJsonStorage()).nextId;
        } catch (_error) {
            await Fsextra.writeJSON(this.filePath, {
                nextId: (this.nextId = 1),
                items: []
            });
        }
    }

    async getById(targetId: number) {
        this.goodIdOrThrow(targetId);
        const entityArr = await this.getAll();
        return entityArr[this.tryFindEntityIndexById(entityArr, targetId)];
    }
    async getAll() {
        return (await this.readJsonStorage()).items;
    }

    async update(newValue: Readonly<T>) {
        this.goodIdOrThrow(newValue.id);
        const entityArr = await this.getAll() as Readonly<T>[];
        entityArr[this.tryFindEntityIndexById(entityArr, newValue.id)] = newValue;
        await this.writeChangesToFile(entityArr);
    }

    /**
     * Deletes entity from storage by given id. Thorws Error, if no such entity was found.
     * @param id
     */
    async delete(id: number) {
        this.goodIdOrThrow(id);
        const entityArr = await this.getAll();
        entityArr.splice(this.tryFindEntityIndexById(entityArr, id), 1);
        await this.writeChangesToFile(entityArr);
    }

    /**
     *  Insterts newValue to the storage and assigns newValue.id to its id in storage.
     *  Returns assigned id.
     * @param newValue Value to insert into storage, newValue.id property is preliminary assigned
     *                 a new value before insertion. Returns assigned newValue.id.
     */
    async insert(newValue: T) {
        newValue.id     = this.nextId++;
        const entityArr = (await this.getAll());
        entityArr.push(newValue);
        await this.writeChangesToFile(entityArr);
        return newValue.id;
    }



// DETAILS------------------------------------------------------------------------------------
    private goodIdOrThrow(suspect: number){
        if (suspect <= 0) {
            throw new Error(`invalid id: ${suspect}`);
        }
    }
    private async readJsonStorage() {
        return JsonFileStorage.readFromJsonFile<JsonJsonFileStorage<T>,
                                                JsonJsonFileStorage<TJsonRepr>>(
            this.filePath, this.storageTD, jsonStorage => ({
                nextId: jsonStorage.nextId,
                items:  jsonStorage.items.map(this.reviveJsonEntity)
            })
        );
    }

    private tryFindEntityIndexById(entityArr: T[], id: number) {
        const targetIndex = entityArr.findIndex(entity => entity.id === id);
        if (targetIndex < 0) {
            throw this.noEntityWasFoundError(id);
        }
        return targetIndex;
    }

    private noEntityWasFoundError(targetId: number) {
        return new Error(`no entity under id ${targetId} was found in "${
            this.filePath
        }"`);
    }

    private async writeChangesToFile(changedValues: T[]) {
        return Fsextra.writeJSON(
            this.filePath, {
                nextId: this.nextId,
                items: changedValues
            }, {
                spaces: 4
            });
    }

}

