import { uploadPDF } from '../services/uploadServices.js'; // Importante o .js

const criarMaterial = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
        }

        console.log('Iniciando upload...');
        
        const urlDoPdf = await uploadPDF(file);

        // AQUI: Salve no banco de dados se precisar
        console.log('Sucesso! URL:', urlDoPdf);

        return res.json({ 
            sucesso: true, 
            url: urlDoPdf,
            mensagem: 'Upload realizado com sucesso!'
        });

    } catch (error) {
        console.error('Erro no controller:', error);
        return res.status(500).json({ erro: 'Erro interno ao salvar material.' });
    }
};

export { criarMaterial };