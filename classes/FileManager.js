const fs = require("fs").promises;
const bcrypt = require("bcrypt");

class FileManager{
    static async resetFiles(){
        await fs.unlink("./users.json");
        await fs.unlink("./products.json");
        await fs.copyFile("./defaults/users.json", "../users.json");
        await fs.copyFile("./defaults/products.json", "../products.json");
    }

    static async getJsonFile(fileName){
        const fileContents = await fs.readFile(`./${fileName}.json`);
        return JSON.parse(fileContents);
    }

    static async writeJsonFile(fileName, fileContents){
        return fs.writeFile(`./${fileName}.json`, JSON.stringify(fileContents));
    }
}

module.exports = FileManager;