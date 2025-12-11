import { Transformer } from 'markmap-lib';
import { fillTemplate } from 'markmap-render';
import nodeHtmlToImage from 'node-html-to-image';
import { writeFile, readdir, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs';

const mdDir = './markmap_resources';
const outDir = './assets/images/markmap';

async function renderMarkmap(markdown, outFile) {
    const transformer = new Transformer();
    const { root, features } = transformer.transform(markdown);
    const assets = transformer.getUsedAssets(features);

    const html = fillTemplate(root, assets, {
        jsonOptions: {
            duration: 0,
            maxInitialScale: 5,
        },
    });

    const image = await nodeHtmlToImage({ 
		html,
		quality: 100,                 
        type: 'png',
        encoding: 'binary',
        puppeteerArgs: {
            defaultViewport: {
                width: 2000,         
                height: 2000,       
                deviceScaleFactor: 2 
            }
        }	
	 });
    await writeFile(outFile, image);
}

async function run() {
    if (!fs.existsSync(outDir)) {
        await mkdir(outDir, { recursive: true });
    }

    const files = await readdir(mdDir);

    for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(mdDir, file);
        const markdown = await readFile(filePath, 'utf-8');

        const baseName = path.basename(file, '.md');
        const outFile = path.join(outDir, `${baseName}.png`);
        if (fs.existsSync(outFile)) {
            console.log(`跳过（已存在）：${outFile}`);
            continue;
        }
        console.log(`Rendering: ${file} → ${outFile}`);
        await renderMarkmap(markdown, outFile);
    }

    console.log('全部 Markmap PNG 生成完毕！');
}

run().catch(console.error);
