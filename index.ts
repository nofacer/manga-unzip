import * as fs from "fs";
import {uid} from "uid";
import * as AdmZip from "adm-zip";
import * as path from "path";
import PDFDocument = require('pdfkit');
import ImageOption = PDFKit.Mixins.ImageOption;

class MangaUnzipper {
    public unzipManga(mangaPaths: string | string[], outputPath: string) {
        this.batchConvert(this.convertToArray(mangaPaths), outputPath)
    }

    protected batchConvert(mangaPaths: string[], outputPath: string) {
        for (const mangaPath of mangaPaths) {
            this.convert(mangaPath, outputPath).catch(e => {
                console.log(e)
            })
        }
    }

    protected async convert(mangaPath: string, outputPath: string): Promise<boolean> {
        this.checkPath(mangaPath)
        const uuid = uid()
        await this.unzip(mangaPath, uuid)
        const images = this.getImages(`/tmp/manga-unzipper/${uuid}`)
        const mangaName = path.basename(mangaPath).split('.')[0]
        this.convertToPdf(images, outputPath, mangaName)
        return true
    }


    protected async unzip(mangaPath: string, uuid: string) {
        if (path.extname(mangaPath) != '.zip') {
            throw `${mangaPath} is not a zip file`
        }
        try {
            fs.mkdirSync('/tmp/manga-unzipper/', {recursive: true})
            const zip = new AdmZip(mangaPath)
            const zipEntries = zip.getEntries()
            zipEntries.forEach(zipEntry => {
                if (this.isImage(zipEntry.name)) {
                    zip.extractEntryTo(zipEntry, `/tmp/manga-unzipper/${uuid}`, false)
                }
            })
            console.log(`extract to /tmp/manga-unzipper/${uuid}`)
        } catch (err) {
            throw `failed to unzip ${mangaPath}`
        }
    }

    protected checkPath(path: string) {
        if (!fs.existsSync(path)) {
            throw `file ${path} not exists`
        }
        return;
    }

    protected getImages(folder: string) {
        if (!fs.existsSync(folder)) throw `folder ${folder} doesn't exist`
        if (!fs.statSync(folder).isDirectory()) throw `${folder} is not a folder`
        const allFiles = fs.readdirSync(folder).sort();
        let images: string[] = []
        if (allFiles.length === 0) {
            throw 'no image file in zip folder'
        }
        allFiles.forEach(file => {
            images.push(path.join(folder, file))
        })
        return images
    }

    protected convertToArray(input: string | string[]) {
        if (typeof input !== 'string') {
            if (!Array.isArray(input)) {
                throw 'input can only be string or array'
            }
        }
        return typeof input === 'string' ? [input] : input
    }

    protected isImage(fileName: string) {
        if (fileName.split('.').length < 2) {
            return false
        }
        return ['jpg', 'png', 'bmp', 'jpeg'].includes(fileName.split('.')[1])
    }

    protected convertToPdf(images: string[], outputPath: string, fileName: string) {
        if (!fs.statSync(outputPath).isDirectory()) throw `output path ${outputPath} is not a folder`
        const doc = new PDFDocument({size: 'A4'});
        doc.pipe(fs.createWriteStream(`${outputPath}/${fileName}.pdf`));
        const imageConfig = {
            fit: [doc.page.width, doc.page.height],
            align: 'center',
            valign: "center"
        } as ImageOption;
        doc.image(images[0], 0, 0, imageConfig)
        images.forEach((image, idx) => {
            if (idx == 0) return
            doc.addPage().image(image, 0, 0, imageConfig)
        })
        doc.end()
    }
}

export {MangaUnzipper}
