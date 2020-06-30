const FileManager =  require('./FileManager');
const bcrypt = require('bcrypt');
const hashRounds = 10;

async function getUsers(){
    return await FileManager.getJsonFile("users");
}

 class Usuario{
    constructor(nome, email, senha, uuid = null){
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.uuid = uuid;
    }

    

    //cria um usuario e retorna seu id, retorna null em caso de erro
    async create(){
        if(this.uuid !== null){
            return null;
        }

        if(this.senha.trim() === "" || this.email.trim() === "" || this.nome.trim() === ""){
            return null;
        }

        let {users, nextId} = await getUsers();
        let usuarioExistente = users.findIndex((usuario) => {
            return this.email === usuario.email;
        });

        if(usuarioExistente > -1){
            return null;
        }

        this.uuid = nextId;
        this.senha = bcrypt.hashSync(this.senha, hashRounds);
        nextId++;
        users.push(this);
        try{
            await FileManager.writeJsonFile("users", {nextId,users});
            return this.uuid;
        } catch(error){
            throw error;
        }
    }

    static async login(email, senha){
        console.log("login chamado");
        const {users} = await getUsers();
        const usuarioEncontrado = users.find((usuario) => {
            return usuario.email === email && bcrypt.compareSync(senha, usuario.senha);
        });

        if(usuarioEncontrado === undefined){
            return false;
        } else {
            const {nome, email, senha, uuid} = usuarioEncontrado
            const objUsuario = new Usuario(nome, email, senha, uuid);
            return objUsuario;
        }
    }

    static async getUser(uuid){
        const objUsuarios = await getUsers();
        const usuario = objUsuarios.users.find((usr) => +usr.uuid === +uuid);
        if(usuario === undefined){
            return false;
        }
        return usuario;
    }
}

module.exports = Usuario;