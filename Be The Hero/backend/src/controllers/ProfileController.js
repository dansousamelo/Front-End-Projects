const connection = require('../database/connection');

module.exports = {
    // Lista apenas casos de uma Ong
    // Devemos informar o ong_id que vem em cada caso
    async index(request, response){
        const ong_id = request.headers.authorization;

        const incidents = await connection('incidents')
        .where('ong_id', ong_id)
        .select('*');

        return response.json(incidents);
    }
}