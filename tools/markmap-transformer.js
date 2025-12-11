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
		quality: 100,                 // PNG质量（对jpg有效，但保留）
        type: 'png',
        encoding: 'binary',
        puppeteerArgs: {
            defaultViewport: {
                width: 2000,         // 页面宽度（提高像素）
                height: 2000,        // 页面高度（足够容纳思维导图）
                deviceScaleFactor: 2 // 像素倍数：2=高清，3=超清
            }
        }	
	 });
    await writeFile(outFile, image);
}

async function run() {
    // 创建输出目录（若不存在）
    if (!fs.existsSync(outDir)) {
        await mkdir(outDir, { recursive: true });
    }

    const files = await readdir(mdDir);

    for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(mdDir, file);
        const markdown = await readFile(filePath, 'utf-8');

        const baseName = path.basename(file, '.md'); // 去掉 .md
        const outFile = path.join(outDir, `${baseName}.png`);
        // 🔥 若 PNG 已存在 → 跳过
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
