const FileManager = require("./FileManager");
class Produto {
    constructor(nome, descricao, categoria, preco = 0, estoque = 0, uuid = null){
        this.nome = nome;
        this.descricao = descricao;
        this.categoria = categoria;
        this.preco = preco;
        this.estoque = estoque;
        this.uuid = uuid;
    }

    async save(){
        let {nextId, products} = await Produto.getProdutos();

        if(this.nome.trim() === "" || this.descricao.trim() === "" || this.categoria.trim() === "" || this.preco < 0){
            return false;
        }

        //se uuid for null e considerado um insert, senao e considerado um update
        if(this.uuid === null){
            this.uuid = nextId;
            nextId++;
            products.push(this);
        } else {
            let produtoExistente = products.findIndex(prd => +prd.uuid === +this.uuid);

            if(produtoExistente < 0){
                return false;
            }

            products[produtoExistente] = this;
        }
        try{
            await FileManager.writeJsonFile("products", {nextId, products});
            return this.uuid;
        } catch(error){
            throw error;
        }
    }

    async delete(){
        if(this.uuid === null){
            return false;
        }
        const {nextId, products} = await Produto.getProdutos();
        const novosProdutos = products.filter(prd => +prd.uuid !== +this.uuid);

        try{
            await FileManager.writeJsonFile("products", {nextId, products: novosProdutos});
            return novosProdutos;
        } catch(erro){
            throw erro;
        }
    }

    static async getProdutos(){
        const produtos = await FileManager.getJsonFile("products");
        return produtos;
    }

    static async getByUuid(wantedUuid){
        const produtos = await Produto.getProdutos();
        const produto = produtos.products.find(prd => +wantedUuid === +prd.uuid);

        if(produto === undefined){
            return false;
        }
        const {nome, descricao, categoria, preco, estoque, uuid} = produto;
        return new Produto(nome, descricao, categoria, preco, estoque, uuid);
    }

    static async filtraProdutos(valorBuscado, tipoFiltro = "nome", pag = 1, limit = 5){
        if(pag <= 0){
            return [];
        }
        
        const {products} = await Produto.getProdutos();
        const indiceInicial = (pag-1) * limit;
        let indiceFinal = indiceInicial + limit;

        const matches = products.reduce((acc, prd) => {
            if(prd[tipoFiltro].toLowerCase().includes(valorBuscado.toLowerCase())){
                const {nome, descricao, categoria, preco, estoque, uuid} = prd;
                acc.push(new Produto(nome, descricao, categoria, preco, estoque, uuid));
            }
            return acc;
        }, []);
        let resultados = [];
        
        if(matches.length > 0 && indiceInicial < matches.length){
            resultados = matches.slice(indiceInicial, indiceFinal);
        }

        return resultados;
    }
}

module.exports = Produto;