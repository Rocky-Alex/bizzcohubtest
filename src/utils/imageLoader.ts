export default function imageKitLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
    if (src.startsWith("https://ik.imagekit.io")) {
        const params = [`w-${width}`];
        if (quality) params.push(`q-${quality}`);
        const paramsString = params.join(",");

        const urlParts = src.split("?");
        return `${urlParts[0]}?tr=${paramsString}`;
    }
    return src;
}
