function dupKeyMessage(err: any): string | null {
    if (err?.code === 11000 && err?.keyValue) {
        const keys = Object.keys(err.keyValue);
        return `Duplicate value for: ${keys.join(", ")}`;
    }
    return null;
}


export default dupKeyMessage;