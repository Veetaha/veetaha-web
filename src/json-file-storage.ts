import * as Fsextra   from 'fs-extra';
import * as Types from './types';
interface JsonFileStorageTD<T extends Types.Identifiable> {
    nextId: number;
    items: T[];
}

/**
 * Represents a JSON file, that contains a server object for storing Types.Identifiable objects.
 * @param T  Typescript type that must implement Types.Identifiable
 *           (i.e. contain {id: number} property). Objects of this type are stored in a JSON file.
 */
export class JsonFileStorage<T extends Types.Identifiable> {
    /**
     * Reads file and interprets its content as a JSON object. Checks that it conforms to
     * the given type description (TD).
     * @type  T         Typescript type return value is treated as, if this function didn't throw.
     * @param filePath  String with the json target file path.
     * @param typeDescr Type description to check resulting JSON value it must conform to.
     *
     * @throws Error If actual JSON value doesn't conform to the given TD,
     *               if failed to read required file,
     *               if failed to parse resulting JSON string.
     */
    public static async readFromJsonFile<T>(
        filePath: string,
        typeDescr: Types.TypeDescription
    ): Promise<T> {
        const jsonString = (await Fsextra.readFile(filePath)).toString();  // throws
        const jsonObj = JSON.parse(jsonString);
        if (Types.conforms<T>(jsonObj, typeDescr)) {
            return jsonObj;
        }
        throw new Error(
            `Actual json data doesn't conform to the required type: ${jsonObj}`
        );
    }

    nextId = 1;
    filePath: string;
    readonly storageTD: Types.TypeDescription;

    /**
     * Creates new instance of JsonFileStorage, but doesn't initialize the file at physical disk.
     * @param itemsTD Type description the resulting JSON value must conform to. (takes ownership)
     * @param filePath  String with the JSON target file path.
     *
     * @throws Error If actual JSON value doesn't conform to the given TD,
     *               if failed to read required file,
     *               if failed to parse resulting JSON string.
     */
    constructor(itemsTD: Types.TypeDescription, filePath: string) {
        this.storageTD = {
            nextId: 'number',
            items: [itemsTD]
        };
        this.filePath = filePath;
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
                this.filePath, this.storageTD
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
        const target = (await this.getAll()).find(item => item.id === targetId);
        if (target) {
            return target;
        } else throw this.noEntityWasFoundError(targetId);
    }
    async getAll() {
        return (await JsonFileStorage.readFromJsonFile<JsonFileStorageTD<T>>(
            this.filePath, this.storageTD
        )).items;
    }

    async update(newValue: Readonly<T>) {
        const entityArr = await this.getAll() as Readonly<T>[];
        const targetIndex = entityArr.findIndex(item => item.id === newValue.id);
        if (targetIndex < 0) {
            throw this.noEntityWasFoundError(newValue.id);
        }
        entityArr[targetIndex] = newValue;
        await this.writeChangesToFile(entityArr);
    }

    async delete(id: number) {
        const entityArr = await this.getAll();
        const rubishIndex = entityArr.findIndex(item => item.id === id);
        if (rubishIndex < 0) {
            throw this.noEntityWasFoundError(id);
        }
        entityArr.splice(rubishIndex, 1);
        await this.writeChangesToFile(entityArr);
    }

    async insert(newValue: T) {
        newValue.id = this.nextId++;
        const entityArr = (await this.getAll());
        entityArr.push(newValue);
        await this.writeChangesToFile(entityArr);
    }

    private noEntityWasFoundError(targetId: number) {
        return new Error(`no entity under id ${targetId} was found in "${this.filePath}"`);
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

