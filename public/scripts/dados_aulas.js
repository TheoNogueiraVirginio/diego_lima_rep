const cursoData = {
    "1": { // ID do Módulo 1
        tituloModulo: "Módulo 1",
        aulas: [
            {
                titulo: "Identidades Importantes", 
                vimeoId: "1160829549",
                
                // Nova estrutura de materiais
                materiais: {
                    teoria: "Teoria_IdentidadesImportantes.pdf",
                    listas: {
                        pe_extensivo: "Q_PE_E_IdentidadesImportantes.pdf",         
                        pe_aprofundamento: "Q_PE_A_IdentidadesImportantes.pdf",    
                        extra: ""                  
                    },
                    gabaritos: {
                        pe_extensivo: "G_PE_E_IdentidadesImportantes.pdf",  
                        pe_aprofundamento: "G_PE_A_IdentidadesImportantes.pdf",
                        extra: ""
                    }
                },
                 
                subAulas: [
                    { titulo: "A cruzadinha", vimeoId: "1160830158" },
                    { titulo: "Complemento de Quadrado", vimeoId: "1161234861" },
                    { titulo: "Binômio de Newton", vimeoId: "1161235585", adminOnly: true },
                ]
            },
            
            
            
            {
                titulo: "Equações do 1º e 2º Grau", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_Equacoes1e2Grau.pdf",
                    gabaritos: { pe_extensivo: "G_PE_E_Equacoes1e2Grau.pdf", pe_aprofundamento: "G_PE_A_Equacoes1e2Grau.pdf"}
                }
            },
            
            
            
            {
                titulo: "Divisibilidade, MDC e MMC", 
                vimeoId: "ABU",
                materiais: {
                    teoria: "Teoria_DivisibilidadeMdcMmc.pdf",
                    gabaritos: { pe_extensivo: "G_PE_E_DivisibilidadeMdcMmc.pdf", pe_aprofundamento: "G_PE_A_DivisibilidadeMdcMmc.pdf" }
                },
                hideMainInSidebar: true,
                subAulas: [
                    { titulo: "Divisibilidade", vimeoId: "1161235737" },
                    { titulo: "MDC e MMC", vimeoId: "1161235060" }
                ]
            },
            
            
            
            {   
                titulo: "Estatística", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_Estatistica.pdf",
                    gabaritos: { pe_extensivo: "G_PE_E_Estatistica.pdf", pe_aprofundamento: "G_PE_A_Estatistica.pdf" }
                }
            },
            
            
            
            {
                titulo: "Conjuntos", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_Conjuntos.pdf",
                    gabaritos: { pe_extensivo: "G_PE_E_Conjuntos.pdf", pe_aprofundamento: "G_PE_A_Conjuntos.pdf" }
                }
            },
            
            
            
            {
                titulo: "Ponto e Introdução de Funções", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_PontoIntFuncoes.pdf",
                    gabaritos: { pe_extensivo: "G_PE_E_PontoIntFuncoes.pdf", pe_aprofundamento: "G_PE_A_PontoIntFuncoes.pdf" }
                }
            },
    
            
            
            {
                titulo: "Reta, Função Afim", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_RetaFuncaoAfim.pdf",
                    gabaritos: { pe_extensivo: "G_PE_E_RetaFuncaoAfim.pdf", pe_aprofundamento: "G_PE_A_RetaFuncaoAfim.pdf" }
                }
            },
            
            
            
            {
                titulo: "Proporcionalidade", 
                vimeoId: "",
                materiais: {
                    teoria: "Teoria_Proporcionalidade.pdf",
                    gabaritos: { pe_extensivo: "G_PE_E_Proporcionalidade.pdf", pe_aprofundamento: "G_PE_A_Proporcionalidade.pdf" }
                }
            },
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
        ]
    }
};



window.cursoData = cursoData;