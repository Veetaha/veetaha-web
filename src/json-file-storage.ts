import * as Fsextra   from 'fs-extra';
import * as Types from './types';
interface JsonFileStorageTD<T extends Types.Identifiable> {
    nextId: number;
    items: T[];
}
export type JsonReviver = (key: string, value: unknown) => unknown;
/**
 * Represents a JSON file, that contains a server object for storing Types.Identifiable objects.
 * @param T  Typescript type that must implement Types.Identifiable
 *           (i.e. contain {id: number} property). Objects of this type are stored in a JSON file.
 */
export class JsonFileStorage<T extends Types.Identifiable> {
    private             nextId = 1;
    public    valueJsonReviver: JsonReviver | undefined;
    private readonly  filePath: string;
    private readonly storageTD: Types.TypeDescription;
//------------------------------------------------------------
    /**
     * Reads file and interprets its content as a JSON object. Checks that it conforms to
     * the given type description (TD).
     * @type  T           Typescript type return value is treated as, if this function didn't throw.
     * @param filePath    String with the json target file path.
     * @param typeDescr   Type description to check resulting JSON value it must conform to.
     * @param jsonReviver Function forwarded as a reviver argument to JSON.parse().
     *
     * @throws Error If actual JSON value doesn't conform to the given TD,
     *               if failed to read required file,
     *               if failed to parse resulting JSON string.
     */
    static async readFromJsonFile<T>(
        filePath: string,
        typeDescr: Types.TypeDescription,
        jsonReviver?: JsonReviver
    ): Promise<T> {
        const jsonString = (await Fsextra.readFile(filePath)).toString();  // throws
        const jsonObj = JSON.parse(jsonString, jsonReviver);
        if (Types.conforms<T>(jsonObj, typeDescr)) {
            return jsonObj;
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
    constructor(itemsTD: Types.TypeDescription, filePath: string, jsonReviver?: JsonReviver) {
        this.storageTD = {
            nextId: 'number',
            items: [itemsTD]
        };
        this.filePath = filePath;
        this.valueJsonReviver = jsonReviver;
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
            this.nextId = (await JsonFileStorage.readFromJsonFile<JsonFileStorageTD<T>>(
                this.filePath, this.storageTD, this.valueJsonReviver
            )).nextId;
        } catch (_error) {
            this.nextId = 1;
            await Fsextra.writeJSON(this.filePath, {
                nextId: this.nextId,
                items: []
            });
        }
    }

    async getById(targetId: number) {
        const entityArr = await this.getAll();
        return entityArr[this.tryFindEntityIndexById(entityArr, targetId)];
    }
    async getAll() {
        return (await JsonFileStorage.readFromJsonFile<JsonFileStorageTD<T>>(
            this.filePath, this.storageTD, this.valueJsonReviver
        )).items;
    }

    async update(newValue: Readonly<T>) {
        const entityArr = await this.getAll() as Readonly<T>[];
        entityArr[this.tryFindEntityIndexById(entityArr, newValue.id)] = newValue;
        await this.writeChangesToFile(entityArr);
    }

    async delete(id: number) {
        const entityArr = await this.getAll();
        entityArr.splice(this.tryFindEntityIndexById(entityArr, id), 1);
        await this.writeChangesToFile(entityArr);
    }

    async insert(newValue: T) {
        newValue.id = this.nextId++;
        const entityArr = (await this.getAll());
        entityArr.push(newValue);
        await this.writeChangesToFile(entityArr);
    }



// DETAILS------------------------------------------------------------------------------------
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

