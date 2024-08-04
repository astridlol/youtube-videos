import ky from "ky";

export default async function checkForShort(id: string) {
    const shortsURL = `https://www.youtube.com/shorts/${id}`;

    try {
        const response = await ky.get(shortsURL);
        return response.url === shortsURL;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}