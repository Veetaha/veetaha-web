import * as Fsextra   from 'fs-extra';
import * as Types from './types';


export async function readFromJsonFile<T>(
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
interface JsonFileStorageTD<T extends Types.Identifiable> {
    nextId: number,
    items: T[]
}

export class JsonFileStorage<T extends Types.Identifiable> {
    nextId = 0;
    filePath: string;
    readonly storageTD: Types.TypeDescription;

    constructor(itemsTD: Types.TypeDescription, filePath: string) {
        this.storageTD = {
            nextId: 'number',
            items: [itemsTD]
        };
        this.filePath = filePath;
    }

    private static noEntityWasFoundError(targetId: number){
        return new Error(`no entity under id ${targetId} was found in "${this.filePath}"`);
    }

    private writeChangesToFile(changedValues: T[]){
        Fsextra.writeJSON(
            this.filePath, {
                nextId: this.nextId,
                items: changedValues
            }, {
                spaces: 4
            });
    }

    async getById(targetId: number) {
        const target = (await this.getAll()).find(item => item.id === targetId);
        if (target) {
            return target
        } else throw JsonFileStorage.noEntityWasFoundError(targetId);

    }
    async getAll() {
        return (await readFromJsonFile<JsonFileStorageTD<T>>(this.filePath, this.storageTD)).items;
    }

    async update(newValue: Readonly<T>) {
        const entityArr = await this.getAll() as Readonly<T>[];
        const targetIndex = entityArr.findIndex(item => item.id === newValue.id);
        if (targetIndex < 0) {
            throw JsonFileStorage.noEntityWasFoundError(newValue.id);
        }
        entityArr[targetIndex] = newValue;
        this.writeChangesToFile(entityArr);
    }

    async delete(id: number) {
        const entityArr = await this.getAll();
        const rubishIndex = entityArr.findIndex(item => item.id === id);
        if (rubishIndex < 0) {
            throw JsonFileStorage.noEntityWasFoundError(id);
        }
        entityArr.splice(rubishIndex, 1);
        this.writeChangesToFile(entityArr);
    }

    async insert(newValue: T) {
        newValue.id = this.nextId++;
        const entityArr = (await this.getAll());
        entityArr.push(newValue);
        this.writeChangesToFile(entityArr);
    }

}

