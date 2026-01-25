'use server';

import fs from 'fs';
import path from 'path';

export async function getAudioFiles() {
    const audioDir = path.join(process.cwd(), 'public', 'Audios');

    try {
        if (!fs.existsSync(audioDir)) {
            console.log('Audio directory missing:', audioDir);
            return [];
        }

        const files = await fs.promises.readdir(audioDir);
        console.log(`Found ${files.length} audio files in ${audioDir}`);

        // Filter for audio extensions
        const audioFiles = files.filter(file =>
            ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.weba'].includes(path.extname(file).toLowerCase())
        );

        return audioFiles.map(file => ({
            name: file,
            path: `/Audios/${file}`
        }));
    } catch (error) {
        console.error("Error reading audio files:", error);
        return [];
    }
}
