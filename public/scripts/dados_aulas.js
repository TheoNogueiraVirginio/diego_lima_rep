const cursoData = {
    "1": { // ID do Módulo 1
        tituloModulo: "Módulo 1",
        aulas: [
            {
                titulo: "Identidades Importantes", 
                vimeoId: "1160829549",
                duracao: 15,
                
                // Nova estrutura de materiais
                materiais: {
                    teoria: "Teoria_IdentidadesImportantes.pdf",
                    listas: {
                        pe_extensivo: "Q_PE_E_IdentidadesImportantes.pdf",         
                        pe_aprofundamento: "Q_PE_A_IdentidadesImportantes.pdf",    
                        extra: "extra_IdentidadesImportantes.pdf"          
                    },
                    gabaritos: {
                        pe_extensivo: "G_PE_E_IdentidadesImportantes.pdf",  
                        pe_aprofundamento: "G_PE_A_IdentidadesImportantes.pdf",
                        extra: ""
                    }
                },
                 
                subAulas: [
                    { titulo: "A cruzadinha", vimeoId: "1160830158", duracao: 5 },
                    { titulo: "Complemento de Quadrado", vimeoId: "1161234861", duracao: 8 },
                    { titulo: "Binômio de Newton", vimeoId: "1161235585", requiredModality: "aprofundamento", duracao: 10 },
                    {titulo: "Questões Difíceis", vimeoId: "1161773683", requiredModality: "extensivo", duracao: 12, requiredModality: "extensivo" },
                    {titulo: "Soma dos quadrados dos primeiros naturais", vimeoId: "1162044528", requiredModality: "aprofundamento", duracao: 6 }
                ]
            },
            
            
            
            {
                titulo: "Equações do 1º e 2º Grau", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_Equacoes1e2Grau.pdf",
                    listas: {
                        pe_extensivo: "Q_PE_E_Equacoes1e2Grau.pdf", 
                        pe_aprofundamento: "Q_PE_A_Equacoes1e2Grau.pdf", 
                        extra: "extra_Equacoes1e2Grau.pdf",
                        extra2: "extra2_Equacoes1e2Grau.pdf"
                    },
                    gabaritos: { 
                        pe_extensivo: "G_PE_E_Equacoes1e2Grau.pdf", 
                        pe_aprofundamento: "G_PE_A_Equacoes1e2Grau.pdf",
                        extra: "extra_G_Equacoes1e2Grau.pdf",
                        extra2: "extra2_G_Equacoes1e2Grau.pdf"
                    }
                },
                hideMainInSidebar: true,
                subAulas: [
                    {titulo: "Equações do 1º Grau", vimeoId: "1161775298", duracao: 9},
                    {titulo: "Equações do 2º Grau", vimeoId: "1161775798", duracao: 26 },
                    {titulo: "Resolução de Questões Difíceis", vimeoId: "1162672760", duracao: 21, requiredModality: "extensivo" },
                    {titulo: "Problematizações Clássicas", vimeoId: "1162269655", duracao: 40, requiredModality: "aprofundamento" },
                    {titulo: "Demonstração da Fórmula de Bhaskara", vimeoId: "1162704955", duracao: 10, requiredModality: "aprofundamento" }
                ]
            },
            
            
            
            {
                titulo: "Divisibilidade, MDC e MMC", 
                vimeoId: "ABU",
                materiais: {
                    teoria: {
                        pe_extensivo: "Teoria_DivisibilidadeMdcMmc.pdf",
                        pe_aprofundamento: "Teoria_Congruencia.pdf"
                    },
                    listas: {pe_extensivo: "Q_PE_E_DivisibilidadeMdcMmc.pdf", pe_aprofundamento: "Q_PE_A_DivisibilidadeMdcMmc.pdf", extra: "Q_E_A_Congruencia.pdf"},
                    gabaritos: { pe_extensivo: "G_PE_E_DivisibilidadeMdcMmc.pdf", pe_aprofundamento: "G_PE_A_DivisibilidadeMdcMmc.pdf", extra: "G_E_A_Congruencia.pdf" }
                },
                hideMainInSidebar: true,
                subAulas: [
                    { titulo: "Divisibilidade", vimeoId: "1161235737", duracao: 24 },
                    { titulo: "MDC e MMC", vimeoId: "1161235060", duracao: 37 },
                    {titulo: "Congruência Modular", vimeoId: "1162319710", requiredModality: "aprofundamento", duracao: 37 },
                    {titulo: "Resolução de Questões Difíceis", vimeoId: "1162675712", requiredModality: "extensivo", duracao: 37 }
                ]
            },
            
            
            
            {   
                titulo: "Estatística", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_Estatistica.pdf",
                    listas: {pe_extensivo: "Q_PE_E_Estatistica.pdf", pe_aprofundamento: "Q_PE_A_Estatistica.pdf"},
                    gabaritos: { pe_extensivo: "G_PE_E_Estatistica.pdf", pe_aprofundamento: "G_PE_A_Estatistica.pdf" }
                },
                hideMainInSidebar: true,
                subAulas: [
                    { titulo: "Interpretação de gráficos e tabelas", vimeoId: "", duracao: 0 },
                    { titulo: "Medidas de tendências centrais", vimeoId: "1162863498", duracao: 53 },
                    {titulo: "Medidas de dispersão", vimeoId: "1162863498", duracao: 35},
                    {titulo: "Resolução de Questões Difíceis", vimeoId: "1162676792", duracao: 21, requiredModality: "extensivo" }
                ]
            },
            
            
            
            {
                titulo: "Conjuntos", 
                vimeoId: "1162704195", duracao: 40,
                materiais: {
                    teoria: "Teoria_Conjuntos.pdf",
                    listas: {pe_extensivo: "Q_PE_E_Conjuntos.pdf", pe_aprofundamento: "Q_PE_A_Conjuntos.pdf"},
                    gabaritos: { pe_extensivo: "G_PE_E_Conjuntos.pdf", pe_aprofundamento: "G_PE_A_Conjuntos.pdf" }
                },
                subAulas: [
                    { titulo: "Conjuntos Numéricos", vimeoId: "1162703820", duracao: 34 },
                    { titulo: "Subconjuntos da Reta Real", vimeoId: "1162807626", duracao: 19 },
                    { titulo: "Resolução de Questões Difíceis", vimeoId: "", duracao: 0, requiredModality: "extensivo" }
                ]
            },
            
            
            
            { //falta conteudo
                titulo: "Ponto e Introdução de Funções", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_PontoIntFuncoes.pdf",
                    listas: {pe_extensivo: "Q_PE_E_PontoIntFuncoes.pdf", pe_aprofundamento: "Q_PE_E_PontoIntFuncoes.pdf"},
                    gabaritos: { pe_extensivo: "G_PE_E_PontoIntFuncoes.pdf", pe_aprofundamento: "G_PE_A_PontoIntFuncoes.pdf" }
                },
                hideMainInSidebar: true,

                subAulas: [
                    {titulo: "Ponto", vimeoId: "1162703424", duracao: 39},
                    {titulo: "Introdução de Funções", vimeoId: "1162705064", duracao: 22},
                    {titulo: "Estudo do domínio de funções", vimeoId: "1162705583", duracao: 15},
                    {titulo: "Gráficos de uma função", vimeoId: "1162728681", duracao: 12},
                    {titulo: "Função injetora, sobrejetora e bijetora", vimeoId: "1162728306", duracao: 12},
                    {titulo: "Paridade de função", vimeoId: "1162728272", duracao: 7},
                    {titulo: "Função inversa", vimeoId: "1162728343", duracao: 15},
                    {titulo: "Translações no gráfico de uma função", vimeoId: "1162729664", duracao: 27},
                ]
            },
    
            
            
            {
                titulo: "Reta e Função", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_RetaFuncaoAfim.pdf",
                    listas: {pe_extensivo: "Q_PE_E_RetaFuncaoAfim.pdf", pe_aprofundamento: "Q_PE_A_RetaFuncaoAfim.pdf"},
                    gabaritos: { pe_extensivo: "G_PE_E_RetaFuncaoAfim.pdf", pe_aprofundamento: "G_PE_A_RetaFuncaoAfim.pdf" }
                },
                hideMainInSidebar: true,

                subAulas: [
                    {titulo: "Reta", vimeoId: "1162852980", duracao: 36},
                    {titulo: "Distância do Ponto à Reta", vimeoId: "1162853078", duracao: 15},
                    {titulo: "Retas Perpendiculares - o Porquê", vimeoId: "1162853173", duracao: 8},
                ]
            },
            
            
            
            {
                titulo: "Proporcionalidade", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_Proporcionalidade.pdf",
                    listas: {pe_extensivo: "Q_PE_E_Proporcionalidade.pdf", pe_aprofundamento: "Q_PE_A_Proporcionalidade.pdf"},
                    gabaritos: { pe_extensivo: "G_PE_E_Proporcionalidade.pdf", pe_aprofundamento: "G_PE_A_Proporcionalidade.pdf" }
                }
            },
            {
                 titulo: "Caderno Revisional",
                 vimeoId: "",
                 materiais: {},
                 subAulas: []
            }
        ]
    },
    "2": { // ID do Módulo 2
        tituloModulo: "Módulo 2",
        aulas: [
            {titulo: "Parábola e Função Quadrática", vimeoId: "11223344" },
            {titulo: "Módulo e Função Modular", vimeoId: "55667788" },
            {titulo: "Potência e Função Exponencial", vimeoId: "11223344" },
            {titulo: "Logaritmos e Função Logarítmica", vimeoId: "55667788" },
            {titulo: "Sequências, PA e PG", vimeoId: "11223344" },
            {titulo: "Matemática Financeira", vimeoId: "55667788" },
            {
                 titulo: "Resolução do Caderno Revisional",
                 vimeoId: "",
                 materiais: {},
                 subAulas: []
            }
        ]
    },
    "3": { // ID do Módulo 3
        tituloModulo: "Módulo 3",
        aulas: [
            {titulo: "Trigonometria", vimeoId: "99887766" },
            {titulo: "Funções Trigonométricas", vimeoId: "99887766" },
            {titulo: "Matrizes", vimeoId: "99887766" },
            {titulo: "Sistemas Lineares", vimeoId: "99887766" },
            {titulo: "Análise Combinatória", vimeoId: "99887766" },
            {titulo: "Probabilidade", vimeoId: "99887766" },
            {
                 titulo: "Resolução do Caderno Revisional",
                 vimeoId: "",
                 materiais: {},
                 subAulas: []
            }
        ]
    },

    "4": {
        tituloModulo: "Módulo 4",
        aulas: [
            {titulo: "Triângulos", vimeoId: "00000001" },
            {titulo: "Polígonos e Quadriláteros", vimeoId: "00000002" },
            {titulo: "Circunferência", vimeoId: "00000003" },
            {titulo: "Áreas", vimeoId: "00000001" },
            {titulo: "Geometria de Posição e Poliedros", vimeoId: "00000002" },
            {titulo: "Prisma e Pirâmides", vimeoId: "00000003" },
            {titulo: "Corpos Redondos", vimeoId: "00000003" },
            {
                 titulo: "Resolução do Caderno Revisional",
                 vimeoId: "",
                 materiais: {},
                 subAulas: []
            }
        ]
    }
};



window.cursoData = cursoData;