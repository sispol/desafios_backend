const express = require('express')
const app = express()
const path = require('path')
const { Server: IOServer } = require('socket.io')
const expressServer = app.listen(8000, () => console.log('server ok !!!'))
const io = new IOServer(expressServer)
const fs = require('fs');
const fileName = 'chat.txt';

const Contenedor = require('./container')

const { database, chatdb } = require('../src/db')

const tableName = 'products';
const tableMessageName = 'messages';

const db = new Contenedor(database,tableName);

const messages = [] 


const createProductTable = async () => {
    try {
        const exists = await database.schema.hasTable(tableName)
        if (!exists) {
            await database.schema
            .createTable(tableName, (table) => {
                table.increments("id").primary();
                table.string("title", 50).notNullable();
                table.integer("price");
                table.string("thumbnail", 255);
            })
            console.log("Table created");
            await insertProducts()
        }
    } catch (error) {
        console.log(error);
        database.destroy();
}
};

const createMessageTable = async () => {
    try {
        const exists = await chatdb.schema.hasTable(tableMessageName)
        if (!exists) {
            await chatdb.schema
            .createTable(tableMessageName, (table) => {
                table.increments("id").primary();
                table.timestamp("datemark");
                table.string("mail",50);
                table.string("message", 255);
            })
            console.log("Table created");
        }
    } catch (error) {
        console.log(error);
        database.destroy();
}
};

async function insertProducts() {
    try {
        const productsObject = [
            {"title":"Tablero","price":15000,"thumbnail":"https://cdn3.iconfinder.com/data/icons/education-209/64/board-math-class-school-128.png"},
            {"title":"Microscopio","price":64500,"thumbnail":"https://cdn3.iconfinder.com/data/icons/education-209/64/microscope-lab-science-school-128.png"},
            {"title":"Lapiz","price":260,"thumbnail":"https://cdn3.iconfinder.com/data/icons/education-209/64/pencil-pen-stationery-school-128.png"},
            {"title":"Escuadra","price":480,"thumbnail":"https://cdn3.iconfinder.com/data/icons/education-209/64/ruler-triangle-stationary-school-128.png"}]
    
    await database(tableName).insert(productsObject)

    console.log('Products created')

    } catch(err) {
        console.log(err)
        database.destroy()
    }
}

app.use(express.static(path.join(__dirname, '../public')))

io.on('connection', async socket => {
    console.log('Se conecto un usuario nuevo')
    socket.emit('server:chat', messages)

    socket.emit('server:products', await db.getAll())
    
    socket.on('server:products', async newProduct => {
        await db.insertProduct(newProduct.title, newProduct.price, newProduct.thumbnail)
        io.emit('server:products', await db.getAll())
    })

    socket.emit('server:chat', messages)

    socket.on('server:chat', async inputMessage => {
        messages.push({
                        dateMark: inputMessage.dateMark,
                        mail: inputMessage.mail,
                        message: inputMessage.message,
                        })
        console.log(inputMessage)
        await chatdb.from(tableMessageName).insert({datemark: inputMessage.dateMark, mail: inputMessage.mail, message: inputMessage.message})
        chatdb.insert
        io.emit('server:chat', messages)
    })
})



async function saveMessages() {
    try {
        await fs.promises.writeFile(fileName, JSON.stringify(messages));
        }
    catch(e) {
        console.log("Hubo un error de escritura: ", e);
    }
}

( async () => {
    createMessageTable()
    createProductTable()
    try {
        const chatHist= await chatdb.from(tableMessageName).select('*');
        chatHist.forEach(element => {
            console.log(element)
            messages.push({dateMark: element.datemark, mail: element.mail, message: element.message})
        });
    } catch(e) {
        console.log('error al leer mensajes historicos: ',e) 
    }
})();
