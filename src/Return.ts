class Return extends Error {
    readonly value: vObject;

    constructor(value: vObject) {
        super();
        this.value = value;
    }
}

export default Return;