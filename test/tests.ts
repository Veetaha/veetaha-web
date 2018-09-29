import { describe, it }  from 'mocha';
import * as mocha from 'mocha';
import { assert }        from 'chai';
import { Types  }        from '../veetaha';
console.log(mocha);
describe('Types.conforms', () => {
    it('should work as typeof when being forwarded a primitive type name as type description', () => {
        // tslint:disable-next-line no-magic-numbers
        assert.isTrue(Types.conforms(23, 'number'));
        assert.isTrue(Types.conforms(true, 'boolean'));
        assert.isTrue(Types.conforms(false, 'boolean'));
        assert.isTrue(Types.conforms(null, 'object'));
        assert.isTrue(Types.conforms(undefined, 'undefined'));
        assert.isTrue(Types.conforms(() => {
        }, 'function'));
        assert.isTrue(Types.conforms({prop: null}, 'object'));
        assert.isTrue(Types.conforms(Symbol(), 'symbol'));
    });

    it('should work with objects as type descriptions', () => {
        assert.isTrue(Types.conforms({prop: 'lala'}, {prop: 'string'}));
        assert.isTrue(Types.conforms(
            {
                prop: 'lala',
                prop2: true,
                obj: {
                    // tslint:disable-next-line no-magic-numbers
                    obj: [23, 43]
                }
            },
            {
                prop: 'string',
                prop2: 'boolean',
                obj: {
                    obj: ['number', 'number']
                }
            }));
    });
    it('should recognize one-item TD array as a random length array', () => {
        assert.isTrue(Types.conforms(
            [{id: 22}, {id: 75}, {id: 55}],
            [{id: 'number'}]
        ));
        assert.isTrue(Types.conforms(
            [],
            [{id: 'number'}]
        ));
        assert.isTrue(Types.conforms(
            [{id: 22}],
            [{id: 'number'}]
        ));
    });
    it('should work with arrays as type descriptions', () => {
        assert.isTrue(Types.conforms(
            // tslint:disable-next-line no-magic-numbers
            [true, null, 22, 'str'],
            ['boolean', 'object', 'number', 'string']
        ));
    });

    it('should take empty arrays and empty objects apart', () => {
        assert.isTrue(Types.conforms([], ['string']));
        assert.isTrue(Types.conforms({}, {}));
        assert.isFalse(Types.conforms({}, [{objects: 'number'}]));
        assert.isFalse(Types.conforms([], {}));
    });
    it('should try to match each TD in a Set', () => {
        assert.isTrue(Types.conforms(
            // tslint:disable-next-line no-magic-numbers
            42, new Set<Types.TypeDescription>(
                [{obj: 'number'}, 'string', 'number', ['boolean']]
            )
        ));
        assert.isFalse(Types.conforms(
            {}, new Set<Types.TypeDescription>(
                [{obj: 'number'}, 'string', 'number', ['boolean']]
            )
        ));

    });
    it('should use given predicate to validate the suspect', () => {
        // tslint:disable-next-line no-magic-numbers
        assert.isTrue(Types.conforms(23, suspect => suspect === 23));
        assert.isTrue(Types.conforms('str', suspect => suspect === 'str'));
        assert.isTrue(Types.conforms({
            prop: 'Ruslan',
            enum: 43
        }, {
            prop: 'string',
            // tslint:disable-next-line no-magic-numbers
            enum: suspect => typeof suspect === 'number' && [58, 4, 43].includes(suspect)
        }));
        assert.isFalse(Types.conforms(true, () => false));
        assert.isFalse(Types.conforms({}, {
            id: 'number',
            login: 'string',
            fullname: 'string',
            registeredAt: _suspect => true,
            avaUrl: 'string',
            isDisabled: 'boolean',
        }));

    });
});
