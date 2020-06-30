const express = require("express");
const Produto = require("../classes/Produto");
const { loggers } = require("winston");
const router = express.Router();

router.post("/", (req, res) => {
    logger.info(`trying to save() a new product`);
    const {nome, descricao, categoria, preco, estoque} = req.body;
    const novoProduto = new Produto(nome, descricao, categoria, preco, estoque);
    novoProduto.save().then(uuid => {
        if(uuid === false){
            errorLogger.error(`an error occurred when saving the product ${JSON.stringify(novoProduto)}`);
            res.status(500).send({"message": "Ocorreu um erro ao cadastrar o produto, verifique os parametros enviados"});
        } else {
            logger.info(`product ${novoProduto.uuid} was saved`);
            res.send({"uuid":uuid});
        }
    }).catch((e) => {
        res.status(500).send(JSON.stringify(e));
    });
});

router.put("/", (req, res) => {
    const {uuid, nome, descricao, categoria, preco, estoque} = req.body;
    logger.info(`trying to update product ${uuid}`);
    Produto.getByUuid(uuid).then (produto => {
        console.log(produto);
        if(produto === false){
            errorLogger.error(`product ${uuid} not found`);
            res.status(404);
            res.end();
        } else {
            logger.info(`product ${novoProduto.uuid} was updated`);
            produto.nome = nome === undefined ? produto.nome : nome;
            produto.descricao = descricao === undefined ? produto.descricao : descricao;
            produto.categoria = categoria === undefined ? produto.categoria : categoria;
            produto.preco = preco === undefined ? produto.preco : preco;
            produto.estoque = estoque === undefined ? produto.estoque : estoque;
    
            produto.save().then(() => {
                res.send(JSON.stringify(produto));
            })
        }
    });
});

router.delete("/", (req, res) => {
    const {uuid} = req.body;
    logger.info(`trying to deleted product ${uuid}`);
    Produto.getByUuid(uuid).then((produto) => {
        console.log(produto);
        if(produto === false){
            res.status(404);
            errorLogger.error(`product ${uuid} not found`);
            res.end();
        } else {
            produto.delete().then(() => {
                logger.info(`product ${novoProduto.uuid} was deleted`);
                res.status(200);
                res.end();
            }).catch(e => {
                errorLogger.error(`an error occurred while trying to delete product ${uuid} ${JSON.stringify(e)}`);
                res.status(500).send(JSON.stringify(e));
            });
        }
    })
});

router.get("/busca/:filtro/:valor/:pagina?", (req, res) => {
    const {filtro, valor, pagina} = req.params;
    logger.info(`searching for ${filtro}: ${valor} on page:${pagina}`);
    Produto.filtraProdutos(valor, filtro, pagina).then(listaProdutos => {
        if(listaProdutos.length < 1){
            errorLogger.error("no products found");
            res.status(404);
        } else {
            res.send(JSON.stringify(listaProdutos));
            
        }
        res.end();
    })
});

router.get("/lista/:pagina?", (req, res) => {
    const {pagina} = req.params;
    logger.info(`retrieving all products on page ${pagina}`)
    Produto.filtraProdutos("","nome", pagina).then(listaProdutos => {
        res.send(JSON.stringify(listaProdutos));
    });
});

module.exports = router;