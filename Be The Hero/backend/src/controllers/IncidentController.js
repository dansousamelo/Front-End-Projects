const connection = require('../database/connection');

module.exports = {
    // index é o nome que geralmente damos para listar algo
    async index(request, response){
        // [count] - pega apenas o primeiro elemento
        const [count] = await connection('incidents').count();

        // Busco o parametro page, se não existir o padrao é 1
        const {page = 1} = request.query;
        //Na url teremos localhost:3333/session?page=1 
        const incidents = await connection('incidents')
        .join('ongs', 'ongs.id', '=', 'incidents.ong_id')
        .limit(5)//Quero pegar de 5 em 5
        .offset((page - 1) * 5)//Cada página terá 5 incidents
        .select(['incidents.*', //Fazemos isso para o id não sobrepor o campo ong_id, pois são iguais
                'ongs.name', 
                'ongs.email', 
                'ongs.whatsapp', 
                'ongs.city', 
                'ongs.uf']);

        response.header('X-Total-Count', count['count(*)']);
        return response.json(incidents);
    },

    async create(request, response){
        const {title, description, value} = request.body;
        //Pegamos a informação do header responsavel pela ong que criou o caso
        const ong_id = request.headers.authorization;
        
        // await connection retorna um array, salvaremos o primeiro 
        // valor do array em uma variável chamada id
        // usamos await para esperar a conexão com o banco de dados
        const [id] = await connection('incidents').insert({
            title,
            description,
            value,
            ong_id,
        });
        // Sempre bom retornar o nome da variável
        return response.json({ id });
    },

    async delete(request, response){
        const { id } = request.params;

        // Precisamos verificar se a ong é dona desse caso
        const ong_id = request.headers.authorization;
        const incidents = await connection('incidents')
        .where('id', id)
        .select('ong_id')
        .first();

        if(incidents.ong_id != ong_id)
            // retorna um status http não autorizado
            return response.status(401).json({error: "Operation not permitted."});

        await connection('incidents').where('id', id).delete();

        //204 é um status http que fala que não tem conteúdo, excluído com êxito
        return response.status(204).send();
    }
};