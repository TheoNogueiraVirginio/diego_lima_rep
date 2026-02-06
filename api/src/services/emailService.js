import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Carrega config somente se não estiver carregado (para scripts isolados)
if (!process.env.GMAIL_USER) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

// Criar o transporter uma vez (singleton pattern simplificado)
const getTransporter = () => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.warn('⚠️ GMAIL_USER ou GMAIL_PASS não definidos. Emails não serão enviados.');
        return null;
    }

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true para 465, false para outras portas
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });
};

const WELCOME_SUBJECT = "Bem Vindo à Plataforma Diego Lima!";
const CREDENTIALS_SUBJECT = "Seus dados de acesso à Plataforma Diego Lima";
// TODO: Ajuste a URL abaixo para o domínio correta da sua produção
const PLATFORM_URL = "https://profdiegolima.com.br/login"; 

const getWelcomeHtml = (name) => `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Olá, ${name}!</p>
        
        <p>Seja muito bem-vindo à Plataforma Diego Lima.</p>

        <p>Aqui você encontrará nossas videoaulas, resoluções comentadas, exercícios e listas extras, tudo organizado para facilitar o seu aprendizado.</p>

        <p>Esta plataforma foi pensada especialmente para auxiliar seus estudos em Matemática e para que você se sinta cada vez mais confiante ao longo do curso, construindo uma base sólida que fará toda a diferença no caminho rumo à sua aprovação.</p>

        <p>Qualquer dúvida, estou à disposição.<br>
        Bons estudos!</p>

        <p><strong>Professor Diego Lima</strong></p>
    </div>
`;

const getCredentialsHtml = (name, email, cpf) => `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Olá, <strong>${name}</strong>!</p>
        
        <p>Estamos enviando este e-mail para garantir que você tenha acesso fácil e rápido a todos os materiais do curso.</p>

        <p>Seguem abaixo suas credenciais de acesso:</p>

        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;">🔗 <strong>Link de Acesso:</strong> <a href="${PLATFORM_URL}" target="_blank">Clique aqui para entrar</a></p>
            <p style="margin: 5px 0;">📧 <strong>Login (E-mail):</strong> ${email}</p>
            <p style="margin: 5px 0;">🔑 <strong>Senha:</strong> ${cpf} <span style="font-size: 0.9em; color: #666;">(apenas os números do seu CPF)</span></p>
        </div>

        <p>Recomendamos que mantenha essas informações em segurança.</p>
        
        <p>Qualquer dúvida ou dificuldade no acesso, não hesite em nos contatar.</p>

        <p>Vamos juntos rumo à aprovação!</p>

        <br>
        <p>Atenciosamente,<br>
        <strong>Professor Diego Lima</strong></p>
    </div>
`;

/**
 * Envia o email de boas vindas
 * @param {string} toEmail 
 * @param {string} name 
 * @returns {Promise<boolean>}
 */
export const sendWelcomeEmail = async (toEmail, name) => {
    const transporter = getTransporter();
    if (!transporter) return false;

    // Extrair primeiro nome se vier nome completo
    const firstName = name.split(' ')[0];

    try {
        const info = await transporter.sendMail({
            from: `"Professor Diego Lima" <${process.env.GMAIL_USER}>`,
            to: toEmail,
            subject: WELCOME_SUBJECT,
            html: getWelcomeHtml(firstName)
        });
        console.log(`✅ Email de boas-vindas enviado para ${toEmail} (ID: ${info.messageId})`);
        return true;
    } catch (error) {
        console.error(`❌ Erro ao enviar email para ${toEmail}:`, error.message);
        return false;
    }
};

/**
 * Envia o email com as credenciais de acesso
 * @param {string} toEmail 
 * @param {string} name 
 * @param {string} cpf - Será usado como senha (números)
 * @returns {Promise<boolean>}
 */
export const sendCredentialsEmail = async (toEmail, name, cpf) => {
    const transporter = getTransporter();
    if (!transporter) return false;

    const firstName = name.split(' ')[0];
    // Garante que o CPF esteja limpo (apenas números) para exibição na senha
    const cpfNumbers = cpf.replace(/\D/g, '');

    try {
        const info = await transporter.sendMail({
            from: `"Professor Diego Lima" <${process.env.GMAIL_USER}>`,
            to: toEmail,
            subject: CREDENTIALS_SUBJECT,
            html: getCredentialsHtml(firstName, toEmail, cpfNumbers)
        });
        console.log(`✅ Email de credenciais enviado para ${toEmail} (ID: ${info.messageId})`);
        return true;
    } catch (error) {
        console.error(`❌ Erro ao enviar email para ${toEmail}:`, error.message);
        return false;
    }
};
