const simuladoQuestions = [
    {
        number: 1,
        title: 'QUESTÃO 01',
        prompt: `Fábio se torna 3° goleiro do mundo com mais jogos sem sofrer gol na história.<br><br>
        Goleiro do Fluminense chegou aos 450 jogos sem ser vazado. Confira a lista dos cinco goleiros com mais jogos sem sofrer gols:<br>
        <ol class="lista-goleiros">
            <li>Clemence: 556</li>
            <li>Buffon: 503</li>
            <li>Fábio: 450</li>
            <li>Shilton: 450</li>
            <li>Casillas: 440</li>
        </ol>
        De acordo com os dados, a média de jogos sem sofrer gols entre os goleiros da lista é de, aproximadamente,`,
        graphic: {
            type: 'none'
        },
        options: [
            '480',
            '482',
            '487',
            '490',
            '498'
        ]
    },
    {
        number: 2,
        title: 'QUESTÃO 02',
        prompt: `Em uma maquete com escala de 1:200, foi representado um prédio cuja base, na realidade, é um quadrado de área igual a 900 m², conforme ilustrado a seguir:`,
        graphic: {
            type: 'maquete'
        },
        options: [
            '15',
            '30',
            '45',
            '225',
            '450'
        ]
    },
    {
        number: 3,
        title: 'QUESTÃO 03',
        prompt: `No mercado financeiro, os investidores costumam acompanhar os valores das ações diariamente para analisar se devem comprar, manter ou vender as ações adquiridas. O gráfico a seguir apresenta os valores no final de cada dia das ações de duas empresas (I e II) dos dias 11 a 15 de maio de determinado ano:<br><br>
        Sabe-se que o valor da ação é indicado no final de cada dia nessa plataforma. O investidor está observando o ritmo de variação dos preços das ações das empresas I e II, o qual se manteve ao longo do mês. Nesse cenário, ele calculou o primeiro dia em que a ação da empresa II valeria mais do que a da empresa I e registrou em um relatório.<br><br>
        Qual dia do mês de maio desse ano foi registrado por esse investidor?`,
        graphic: {
            type: 'none'
        },
        options: [
            '17',
            '18',
            '19',
            '20',
            '21'
        ]
    },
    {
        number: 4,
        title: 'QUESTÃO 04',
        prompt: `A variação do PIB, medida pelo SCNT – Sistema de Contas Nacionais Trimestrais – traz a evolução do PIB no tempo, comparando seu desempenho trimestre a trimestre e ano a ano. Veja abaixo o gráfico da variação trimestral do PIB no Brasil do 2º trimestre de 2022 até o 1º trimestre de 2025.<br><br>
        De acordo com o gráfico acima, temos que`,
        graphic: {
            type: 'none'
        },
        options: [
            'O quarto trimestre de 2022 teve um melhor desempenho do PIB comparado ao quarto trimestre de 2024.',
            'O primeiro trimestre de 2024 teve um melhor desempenho do PIB comparado ao primeiro trimestre de 2023.',
            'Durante todo o ano de 2024, ocorreu o crescimento do PIB no Brasil.',
            'O primeiro trimestre de 2025 teve um melhor desempenho do PIB comparado ao primeiro trimestre de 2024.',
            'No ano de 2023 e 2024, o melhor desempenho do PIB ocorreu no primeiro semestre do ano.'
        ]
    },
    {
        number: 5,
        title: 'QUESTÃO 05',
        prompt: `Uma criança com 40 kg precisou ser medicada com uma única dose de 20 mL de determinado medicamento. Após alguns anos, já na adolescência e com 58 kg, essa mesma pessoa precisou ser medicada novamente com esse mesmo medicamento. Porém, a dosagem indicada desse remédio é diretamente proporcional à massa muscular do paciente. Se esse mesmo medicamento só é vendido em frascos com exatamente 25 mL, quanto, no mínimo, essa pessoa vai gastar para ser medicada, sabendo que cada frasco desse remédio custa R$ 38,00?`,
        graphic: {
            type: 'none'
        },
        options: [
            'R$ 38,00',
            'R$ 44,08',
            'R$ 76,00',
            'R$ 88,16',
            'R$ 114,00'
        ]
    },
    {
        number: 6,
        title: 'QUESTÃO 06',
        prompt: `A equipe responsável pela manutenção da área gramada de uma praça irá comprar um pacote de fertilizante para a aplicação no local. A quantidade de fertilizante contida no pacote, assim como a quantidade recomendada para aplicação por metro quadrado, está indicada na imagem a seguir.<br><br>
        Sabe-se que a área gramada dessa praça tem 350 m² ao todo, e a aplicação do fertilizante será realizada em toda essa extensão. Considerando a recomendação da embalagem e desconsiderando perdas, antes de iniciar o serviço e abrir o pacote, foram formuladas cinco hipóteses diferentes pela equipe de trabalho, em relação à quantidade de produto adquirida:<br><br>
        I. Hipótese I: a compra é adequada e ainda sobrará 1,5 kg de fertilizante para outros fins.<br>
        II. Hipótese II: a quantidade adquirida é exatamente a necessária para o serviço.<br>
        III. Hipótese III: serão necessários exatos 2,5 kg adicionais de fertilizante para atender às especificações.<br>
        IV. Hipótese IV: serão necessários mais 5 kg de fertilizante para atender às especificações.<br>
        V. Hipótese V: a equipe está adquirindo 7,5 kg a mais do que o recomendado para essa área.<br><br>
        Das hipóteses formuladas pela equipe, a que está mais adequada de acordo com a situação apresentada é a`,
        graphic: {
            type: 'none'
        },
        options: [
            'I.',
            'II.',
            'III.',
            'IV.',
            'V.'
        ]
    },
    {
        number: 7,
        title: 'QUESTÃO 07',
        prompt: `Uma fábrica do ramo de laticínios produz queijos em prensas hidráulicas idênticas. Em uma fase piloto, 5 prensas operaram 7 horas por dia durante 6 dias, obtendo exatamente 14 000 queijos. Para um festival gastronômico, a produção precisará ser ampliada para produzir uma determinada quantidade de queijos em um tempo menor. Para isso, serão instaladas 5 novas prensas hidráulicas de um outro modelo, com o dobro da capacidade de produção, as quais passarão a atuar conjuntamente com as anteriores. Sabe-se que, para atender a essa demanda para o evento, as prensas passarão a operar 8 horas por dia e finalizarão a demanda em exatamente 4 dias completos de operação. Qual quantidade de queijos será produzida ao todo para essa demanda do festival?`,
        graphic: {
            type: 'none'
        },
        options: [
            '16 000',
            '18 000',
            '28 000',
            '32 000',
            '42 000'
        ]
    },
    {
        number: 8,
        title: 'QUESTÃO 08',
        prompt: `Durante a Semana da Saúde e do Esporte, uma escola realizou uma pesquisa com 50 alunos do ensino médio para verificar a prática de atividades físicas extracurriculares. Todos os alunos responderam 3 perguntas e os resultados foram apresentados na tabela abaixo:<br><br>
        Futebol — 28 alunos<br>
        Vôlei — 21 alunos<br>
        Não praticam — 13 alunos<br><br>
        Para evitar a sobreposição de jogos na Semana da Saúde, a coordenação precisa saber a quantidade de alunos que praticam os dois esportes. Com base nos dados apresentados, a coordenação deve concluir que o número de alunos que praticam futebol e vôlei é`,
        graphic: {
            type: 'none'
        },
        options: [
            '9',
            '11',
            '12',
            '15',
            '17'
        ]
    },
    {
        number: 9,
        title: 'QUESTÃO 09',
        prompt: `No Ceará, a cobrança de energia elétrica é realizada por empresa privada, sob regulação da ANEEL (Agência Nacional de Energia Elétrica). A conta considera o consumo em quilowatt-hora (kWh), a Tarifa de Uso do Sistema de Distribuição (TUSD) e tributos como ICMS e PIS/COFINS, o que pode representar até 50% do total. Famílias de baixa renda podem obter desconto pela Tarifa Social. As tarifas são reajustadas anualmente e, em 2025, houve redução média de 2,10%. O gráfico a seguir apresenta o consumo mensal de energia elétrica (em kWh) de uma residência, de janeiro a junho. Para estimar o consumo do mês de julho, será utilizada a média aritmética dos três meses anteriores (abril, maio e junho). Nessas condições, a previsão aproximada de consumo para o mês de julho será`,
        graphic: {
            type: 'none'
        },
        options: [
            'inferior ao de janeiro',
            'inferior ao de março',
            'inferior ao de maio',
            'superior ao de abril',
            'superior ao de maio'
        ]
    },
    {
        number: 10,
        title: 'QUESTÃO 10',
        prompt: `Uma empresa de tecnologia está desenvolvendo um novo sistema de armazenamento de dados em nuvem. Para avaliar sua eficiência, foi realizado um experimento no qual o sistema conseguiu armazenar 1 024 arquivos em 8 servidores, distribuídos de forma igualitária entre eles. Após análise dos resultados, a equipe responsável decidiu dobrar a quantidade de servidores disponíveis e, ao mesmo tempo, ampliar a capacidade do sistema de modo que o número total de arquivos armazenados aumentasse em 50%. Com base nessas alterações, determine a quantidade de arquivos que ficará armazenada em cada servidor.`,
        graphic: {
            type: 'none'
        },
        options: [
            '64 arquivos',
            '96 arquivos',
            '128 arquivos',
            '160 arquivos',
            '192 arquivos'
        ]
    },
    {
        number: 11,
        title: 'QUESTÃO 11',
        prompt: `O gráfico mostra a temperatura média e a precipitação de chuva em uma determinada localidade em cada um dos meses de 2025. Com base na análise do gráfico, qual das conclusões a seguir está correta?`,
        graphic: {
            type: 'none'
        },
        options: [
            'O mês mais chuvoso foi também o mais quente.',
            'O mês menos chuvoso foi também o mais frio.',
            'De outubro para novembro aumentaram a precipitação e a temperatura.',
            'Os dois meses mais quentes foram também os de maior precipitação.',
            'Os dois meses mais frios foram também os de menor precipitação.'
        ]
    },
    {
        number: 12,
        title: 'QUESTÃO 12',
        prompt: `Uma pessoa está avaliando duas opções de investimento:<br><br>
        Fundo A: rendimento médio mensal de 1,0% e desvio padrão de 0,2%.<br>
        Fundo B: rendimento médio mensal de 0,8% e desvio padrão de 0,08%.<br><br>
        Essa pessoa deseja escolher o fundo que apresenta maior estabilidade nos rendimentos mensais, ou seja, aquele com menor risco relativo. Com base nessas informações, qual fundo deve ser escolhido?`,
        graphic: {
            type: 'none'
        },
        options: [
            'Fundo A, pois tem maior rendimento médio.',
            'Fundo B, pois tem menor desvio padrão.',
            'Fundo A, pois tem menor coeficiente de variação.',
            'Fundo B, pois tem menor coeficiente de variação.',
            'Os dois fundos apresentam a mesma estabilidade.'
        ]
    },
    {
        number: 13,
        title: 'QUESTÃO 13',
        prompt: `Nos últimos anos, uma escola pública passou a monitorar o desempenho dos alunos nas avaliações mensais de Matemática, com o objetivo de ajustar suas práticas pedagógicas. A seguir estão as notas obtidas por um grupo de 15 estudantes em uma mesma avaliação, numa escala de 0 a 10:<br><br>
        4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 8, 8.<br><br>
        Com o intuito de compreender melhor o perfil da turma, a equipe pedagógica decidiu calcular as três principais medidas de tendência central: a moda, a mediana e a média aritmética. Essas informações foram consideradas fundamentais para orientar futuras estratégias de ensino. Então, as medidas obtidas foram,`,
        graphic: {
            type: 'none'
        },
        options: [
            'moda = 5; mediana = 6; média = 6.',
            'moda = 6; mediana = 6; média = 7.',
            'moda = 5; mediana = 7; média = 6.',
            'moda = 5; mediana = 5; média = 8.',
            'moda = 5; mediana = 6; média = 5.'
        ]
    },
    {
        number: 14,
        title: 'QUESTÃO 14',
        prompt: `Uma pessoa resolve aproveitar e comprar um par de sapatos na Black Friday e o encontra em 5 lojas on-line: na loja K, o sapato, que custa R$ 102,00, está com desconto de 10%; na loja W, o mesmo sapato custa R$ 110,00 e o desconto é de 12%; na loja X, o valor cobrado nesse sapato é R$ 120,00 e o desconto concedido é de 25%; na loja Y, o sapato custa R$ 125,00 e o desconto é de 29%; e na loja Z, o valor cobrado pelo sapato é R$ 190,00 e o desconto é de 50%. Para decidir em qual loja comprar, a pessoa se organizou com funções de 1° grau. Observe as anotações dela, em que 'c' representa o custo do sapato em cada loja:<br><br>
        Loja K: f(c)=0,9c<br>
        Loja W: f(c)=0,88c<br>
        Loja X: f(c)=0,75c<br>
        Loja Y: f(c)=0,71c<br>
        Loja Z: f(c)=0,5c<br><br>
        Para que a compra seja o mais barato possível, a loja escolhida foi`,
        graphic: {
            type: 'none'
        },
        options: [
            'K.',
            'W.',
            'X.',
            'Y.',
            'Z.'
        ]
    },
    {
        number: 15,
        title: 'QUESTÃO 15',
        prompt: `Um motorista observa que o consumo de combustível do seu carro é diretamente proporcional à distância percorrida e inversamente proporcional à eficiência do veículo, medida em quilômetros por litro. Em uma viagem de 300 km, o carro consumiu 20 litros de combustível. Considerando que a eficiência do carro aumentou 25%, qual será o consumo esperado para uma viagem de 450 km?`,
        graphic: {
            type: 'none'
        },
        options: [
            '18 litros.',
            '20 litros.',
            '22 litros.',
            '24 litros.',
            '26 litros.'
        ]
    },
    {
        number: 16,
        title: 'QUESTÃO 16',
        prompt: `O proprietário de um apartamento que ele coloca à disposição para aluguel e periodicamente recebe inquilinos cuja estadia pode durar de alguns dias até muitas semanas. No último ano, contudo, a procura pelo imóvel de João não foi tão alta e houve meses inteiros em que o apartamento permaneceu desocupado. Para identificar quantos foram esses meses, João examina a conta de energia mais recente do apartamento, a qual contém, além do valor pago no último mês, os valores pagos nos 12 meses antecedentes, que são reportados na forma de gráfico mostrado a seguir. Sabe-se que, nos meses com ocupação do imóvel, o valor pago na conta envolveu, além da taxa de manutenção do kWh, o valor base cobrado pela concessionária de energia, também presente na conta nos meses sem ocupação, o valor referente ao consumo de eletricidade propriamente dito. O número de meses em que o apartamento de João ficou desocupado no último ano é`,
        graphic: {
            type: 'none'
        },
        options: [
            '1.',
            '2.',
            '4.',
            '5.',
            '6.'
        ]
    },
    {
        number: 17,
        title: 'QUESTÃO 17',
        prompt: `Seis pessoas partem para uma excursão com mantimentos suficientes para um período de quinze dias. Passados três dias do início da excursão, três novos integrantes se juntam ao grupo. Quantos dias, contados a partir do início da excursão, durarão os mantimentos?`,
        graphic: {
            type: 'none'
        },
        options: [
            '11',
            '12',
            '13',
            '14',
            '15'
        ]
    },
    {
        number: 18,
        title: 'QUESTÃO 18',
        prompt: `Ao planejar uma viagem a negócios, o executivo de uma empresa multinacional decidiu consultar o histórico de temperaturas médias da cidade para a qual viajará, a fim de organizar as vestimentas que levaria em sua mala. Ao acessar um site com dados meteorológicos, ele consultou a temperatura média da cidade nos últimos 30 dias e se deparou com o gráfico a seguir. Com base nessas informações, a temperatura que corresponde a`,
        graphic: {
            type: 'none'
        },
        options: [
            '18°C',
            '19°C',
            '20°C',
            '22°C',
            '26°C'
        ]
    },
    {
        number: 19,
        title: 'QUESTÃO 19',
        prompt: `Uma loja de automóveis, após um ano de vendas satisfatórias, decidiu premiar seus três funcionários – André, Bianca e Carlos – com a quantia de R$ 41 600,00. Esse valor será dividido em partes diretamente proporcionais às idades e inversamente proporcionais ao número de faltas registradas por cada um durante o ano. A tabela a seguir apresenta as idades e o número de faltas de cada funcionário:<br><br>
        André — 24 anos e 15 faltas<br>
        Bianca — 36 anos e 30 faltas<br>
        Carlos — 40 anos e 60 faltas<br><br>
        Com base nessas informações, o valor que deverá ser destinado a André, em reais, é`,
        graphic: {
            type: 'none'
        },
        options: [
            'R$ 8 000,00',
            'R$ 14 400,00',
            'R$ 13 867,00',
            'R$ 15 000,00',
            'R$ 19 200,00'
        ]
    },
    {
        number: 20,
        title: 'QUESTÃO 20',
        prompt: `João precisa comprar um guarda-roupa para seu novo quarto. Como acabou de realizar sua mudança, ainda está com seus pertences armazenados em caixas e não possui nenhum equipamento para medir o espaço disponível em seu quarto para o móvel. Assim, ele decidiu medir as dimensões do espaço com a palma da sua mão. O local disponível para o guarda-roupa é retangular, com dimensões de 10 palmos por 3 palmos. Ao chegar na loja de móveis, o vendedor informou ao atendente que seu palmo mede 23 cm. Considerando que cada medição com seus palmos pode gerar um erro de medição de 10% para mais ou para menos, a maior dimensão do espaço disponível para o guarda-roupa mede`,
        graphic: {
            type: 'none'
        },
        options: [
            'entre 207,0 e 253,0 cm.',
            'entre 220,0 e 240,0 cm.',
            'entre 230,0 e 240,0 cm.',
            'entre 227,7 e 232,3 cm.',
            'entre 230,0 e 232,3 cm.'
        ]
    },
    {
        number: 21,
        title: 'QUESTÃO 21',
        prompt: `O departamento de gestão de pessoas de uma empresa realizou uma pesquisa sobre o número de horas diárias dedicadas por 120 funcionários ao trabalho remoto. As respostas obtidas foram organizadas no gráfico a seguir, que relaciona o número de funcionários com o número de horas diárias que cada um trabalhou de maneira remota. Com base na pesquisa realizada, o número médio de horas diárias dedicadas por funcionário ao trabalho remoto é igual a`,
        graphic: {
            type: 'none'
        },
        options: [
            '2,00',
            '2,65',
            '2,75',
            '2,80',
            '4,30'
        ]
    },
    {
        number: 22,
        title: 'QUESTÃO 22',
        prompt: `Durante o preparo de uma grande quantidade de sopa, um cozinheiro precisou utilizar três panelas de pressão para fazer todo o cozimento simultaneamente. As figuras a seguir mostram os volumes, em decilitro, de sopa preparados em cada panela. O último ingrediente a ser adicionado no preparo dessa sopa são dois tabletes de curry com 91 g cada. Para que o conteúdo final nas três panelas fique com o mesmo sabor, o cozinheiro irá dividir os tabletes em quantidades proporcionais aos volumes de sopa contidos em cada panela.`,
        graphic: {
            type: 'none'
        },
        options: [
            '25',
            '36',
            '50',
            '72',
            '110'
        ]
    },
    {
        number: 23,
        title: 'QUESTÃO 23',
        prompt: `Um agricultor monitorou a quantidade de água disponível em uma caixa-d'água durante o funcionamento de um sistema de irrigação automatizado. O aplicativo utilizado pelo agricultor gerou o gráfico a seguir, que mostra a variação do volume de água na caixa, em litro, ao longo de 24 horas. Durante o período registrado no gráfico, por quantas horas a caixa-d'água permaneceu completamente vazia?`,
        graphic: {
            type: 'none'
        },
        options: [
            '4',
            '6',
            '8',
            '12',
            '18'
        ]
    },
    {
        number: 24,
        title: 'QUESTÃO 24',
        prompt: `Uma confeiteira fez cinco bolos de aniversário para serem entregues, no mesmo dia, em diferentes locais. Em um aplicativo que representa a posição do usuário como a origem de um plano cartesiano em eixos cotados em quilômetro, ela pesquisou os endereços das entregas, que foram identificadas pelos pontos I, II, III, IV e V nesse mesmo sistema de coordenadas, como mostra a figura a seguir. A confeiteira decidiu iniciar as entregas pelo local que apresenta a maior distância, em linha reta, em relação à posição dela. As entregas serão iniciadas pelo endereço`,
        graphic: {
            type: 'none'
        },
        options: [
            'I.',
            'II.',
            'III.',
            'IV.',
            'V.'
        ]
    },
    {
        number: 25,
        title: 'QUESTÃO 25',
        prompt: `Quinzenalmente, um feirante compra 600 ovos de um granjeiro, ao preço de R$ 9,60 a dúzia, para revender em sua banca na feira. Porém, nem todos os ovos chegam a ser colocados à venda, pois há uma perda de aproximadamente 4% dos ovos durante o transporte e o feirante sempre separa 4 dúzias para consumo próprio. Com os ovos restantes, ele obtém um lucro de R$ 400,00 sobre o valor pago ao granjeiro quando consegue vender todas as dúzias sem desconto. Por qual preço, em real, a dúzia de ovos é anunciada, sem desconto, na banca desse feirante?`,
        graphic: {
            type: 'none'
        },
        options: [
            '16,70',
            '17,60',
            '18,40',
            '19,20',
            '20,00'
        ]
    },
    {
        number: 26,
        title: 'QUESTÃO 26',
        prompt: `Paulo investiu R$ 60,00 na fabricação de bonés de tecido para vendê-los em uma feira, ao preço de R$ 12,00 cada um. Considere x o número de bonés vendidos e L(x) o lucro obtido com a venda dos x bonés. Nessas condições, assinale o gráfico que melhor representa L(x).`,
        graphic: {
            type: 'none'
        },
        options: [
            'gráfico A',
            'gráfico B',
            'gráfico C',
            'gráfico D',
            'gráfico E'
        ]
    },
    {
        number: 27,
        title: 'QUESTÃO 27',
        prompt: `Uma empresa de engenharia foi contratada para realizar um serviço no valor de R$ 71 250,00. Os sócios da empresa decidiram que 40% desse valor seria destinado ao pagamento de três engenheiros que gerenciaram o serviço. O pagamento para cada um deles será feito de forma diretamente proporcional ao total de horas trabalhadas. O número de dias e o número de horas diárias trabalhadas pelos engenheiros foram, respectivamente:<br><br>
        engenheiro I: 4 dias, numa jornada de 5 horas e meia por dia;<br>
        engenheiro II: 5 dias, numa jornada de 4 horas por dia;<br>
        engenheiro III: 6 dias, numa jornada de 2 horas e 30 minutos por dia.<br><br>
        Qual a maior diferença, em real, entre os valores recebidos por esse serviço entre dois desses engenheiros?`,
        graphic: {
            type: 'none'
        },
        options: [
            '1000',
            '1500',
            '3500',
            '3800',
            '5250'
        ]
    },
    {
        number: 28,
        title: 'QUESTÃO 28',
        prompt: `Cinco escolas participaram de uma olimpíada regional de Matemática promovida pela secretaria de educação da região. Após a correção das provas, a comissão organizadora divulgou a média e o desvio padrão dos estudantes de cada escola, como mostra o quadro a seguir:<br><br>
        Escola X: média 74, desvio padrão 8;<br>
        Escola Y: média 75, desvio padrão 15;<br>
        Escola Z: média 72, desvio padrão 12;<br>
        Escola W: média 74, desvio padrão 5;<br>
        Escola T: média 75, desvio padrão 10.<br><br>
        A cada edição, essa olimpíada premia a escola cuja média das notas dos estudantes foi a maior. No entanto, como os valores das médias foram iguais para algumas escolas, a comissão optou por utilizar a regularidade nas notas dos estudantes como critério de desempate. Com base nesses dados, qual escola apresentou o melhor desempenho no período considerado?`,
        graphic: {
            type: 'none'
        },
        options: [
            'Escola X',
            'Escola Y',
            'Escola Z',
            'Escola W',
            'Escola T'
        ]
    },
    {
        number: 29,
        title: 'QUESTÃO 29',
        prompt: `O plano básico de uma plataforma de cursos on-line custa R$ 30,00 mensais e oferece ao usuário 60 videoaulas e 10 materiais extras para estudo. Com o objetivo de atrair mais matrículas, a plataforma pretende lançar um novo plano ao custo de R$ 90,00 mensais, o qual disponibilizará 120 videoaulas a mais que o básico. Com essa novidade, será lançada também uma promoção, na qual os primeiros 100 assinantes do novo plano ganharão 18 videoaulas adicionais. O objetivo dessa promoção é garantir que, com as videoaulas adicionais da promoção, o novo plano mantenha a proporção entre videoaulas e materiais extras do plano básico. Para atingir o objetivo, o número total de materiais extras disponibilizados no novo plano para os primeiros 100 assinantes deve ser`,
        graphic: {
            type: 'none'
        },
        options: [
            '20',
            '25',
            '30',
            '33',
            '51'
        ]
    },
    {
        number: 30,
        title: 'QUESTÃO 30',
        prompt: `Em uma fábrica de bebidas, cinco máquinas são responsáveis por envasar garrafas de vidro. Cada máquina opera de forma contínua ao longo do dia, mas pode apresentar falhas que resultam na quebra de algumas garrafas durante o processo. O desempenho de cada máquina é avaliado pela razão entre o número de garrafas que não quebraram (intactas) e o total de garrafas envasadas. Os dados registrados em um dia de operação estão apresentados no quadro a seguir:<br><br>
        máquina I: 1080 quebradas, total 7200;<br>
        máquina II: 480 quebradas, total 4800;<br>
        máquina III: 1200 quebradas, total 6000;<br>
        máquina IV: 720 quebradas, total 3600;<br>
        máquina V: 300 quebradas, total 2400.<br><br>
        Considere que, quanto mais próximo de 1 for o valor do desempenho, melhor será a eficiência da máquina, pois isso indica que uma maior proporção de garrafas foi envasada sem quebra. Com base nesses dados, qual máquina apresentou o melhor desempenho no período considerado?`,
        graphic: {
            type: 'none'
        },
        options: [
            'I',
            'II',
            'III',
            'IV',
            'V'
        ]
    },
    {
        number: 31,
        title: 'QUESTÃO 31',
        prompt: `Um ciclista estabeleceu a meta de percorrer a distância entre duas cidades durante três dias. No primeiro dia, percorreu um terço da distância. No dia seguinte, mais um terço do que faltava. Que fração da distância ele necessita percorrer no terceiro dia para atingir sua meta?`,
        graphic: {
            type: 'none'
        },
        options: [
            '1/2',
            '3/2',
            '2/3',
            '4/9',
            '5/9'
        ]
    },
    {
        number: 32,
        title: 'QUESTÃO 32',
        prompt: `Para a organização de uma festa de aniversário, a empresa responsável dividiu a programação da festa em blocos. Tal divisão foi feita de modo que em cada bloco tivesse uma seleção de músicas e, no intervalo entre cada bloco, um dos amigos do aniversariante apresentasse uma mensagem de felicitações, sendo que a festa começaria e finalizaria com a seleção de músicas, não havendo fala de nenhum amigo antes do primeiro bloco e ao final do último bloco. Para a distribuição das músicas nos blocos, a empresa selecionou 144 músicas diferentes, sendo 36 no estilo pagode, 48 no estilo sertanejo e 60 no estilo pop. Sabe-se que as músicas foram divididas igualmente de maneira que em todos os blocos houvesse músicas de todos os estilos e a mesma quantidade de músicas por estilo. As músicas foram divididas nos maiores quantidades de blocos possíveis.`,
        graphic: {
            type: 'none'
        },
        options: [
            '5',
            '8',
            '9',
            '12',
            '15'
        ]
    },
    {
        number: 33,
        title: 'QUESTÃO 33',
        prompt: `Quando um fazendeiro percebeu que algumas frutas de seu pomar estavam ficando maduras, prometeu ao filho que pagaria R$ 3,00 por hora trabalhada, se ele o ajudasse por um dia na colheita. Represente por t o número de horas trabalhadas pelo filho do fazendeiro e por q a quantidade que ele recebeu do pai ao final do dia de trabalho. A expressão matemática que relaciona as grandezas q e t é`,
        graphic: {
            type: 'none'
        },
        options: [
            'q = 3t',
            't = 3q',
            'q = t + 3',
            't = q + 3',
            'q = -t + 3'
        ]
    },
    {
        number: 34,
        title: 'QUESTÃO 34',
        prompt: `Uma escola vai organizar uma gincana e precisa dividir 360 alunos em grupos todos com o mesmo número de participantes, de modo que: cada grupo tenha mais de 12 alunos; o número de alunos em cada grupo seja um divisor de 72; e o número total de grupos seja um múltiplo de 5. O maior número de grupos possível é igual a`,
        graphic: {
            type: 'none'
        },
        options: [
            '5',
            '15',
            '20',
            '25',
            '30'
        ]
    },
    {
        number: 35,
        title: 'QUESTÃO 35',
        prompt: `Uma equipe de voluntários está organizando a distribuição de cestas básicas. Em determinado bairro, 6 voluntários conseguem distribuir 180 cestas em 4 dias, trabalhando 5 horas por dia. Mantendo o mesmo ritmo de trabalho, quantas cestas básicas poderão ser distribuídas por 9 voluntários, em 6 dias, trabalhando 4 horas por dia?`,
        graphic: {
            type: 'none'
        },
        options: [
            '240',
            '270',
            '300',
            '324',
            '360'
        ]
    },
    {
        number: 36,
        title: 'QUESTÃO 36',
        prompt: `João levou seu carro para fazer a revisão, na qual foram trocados o óleo do motor, o filtro de óleo, o filtro de ar e o filtro de combustível. Ao observar a nota de serviços verificou que esses itens corresponderam, respectivamente, a 50%, 8%, 22% e 20% do valor total da nota. Ao pagar em dinheiro, João conseguiu um desconto de 10% no valor do óleo do motor. O desconto obtido no valor total da revisão foi de`,
        graphic: {
            type: 'none'
        },
        options: [
            '45%',
            '40%',
            '10%',
            '5%',
            '4%'
        ]
    },
    {
        number: 37,
        title: 'QUESTÃO 37',
        prompt: `Uma empresa de tecnologia acompanha mensalmente o número de chamados técnicos recebidos pelo seu suporte. A tabela mostra os valores registrados do primeiro semestre:<br><br>
        Janeiro — 120<br>
        Fevereiro — 135<br>
        Março — 150<br>
        Abril — 140<br>
        Maio — 165<br>
        Junho — 180.<br><br>
        Se, para agosto e dezembro desse ano, a empresa deseja receber o maior e o menor número mensal de chamados técnicos do primeiro semestre, respectivamente, então`,
        graphic: {
            type: 'none'
        },
        options: [
            'agosto: junho; dezembro: janeiro',
            'agosto: junho; dezembro: fevereiro',
            'agosto: maio; dezembro: janeiro',
            'agosto: abril; dezembro: janeiro',
            'agosto: junho; dezembro: março'
        ]
    },
    {
        number: 38,
        title: 'QUESTÃO 38',
        prompt: `Uma empresa de tecnologia monitora, semanalmente, o número de acessos ao seu aplicativo. O gráfico apresenta a quantidade de acessos registrados nos quatro primeiros meses do ano. Com base nas informações do gráfico,`,
        graphic: {
            type: 'none'
        },
        options: [
            'de março para abril houve um aumento absoluto de acessos maior que o observado de janeiro para fevereiro.',
            'o mês de menor variação em relação ao mês anterior foi fevereiro.',
            'o mês de maior quantidade de acessos registrados foi junho.',
            'de janeiro para abril o gráfico é sempre crescente.',
            'de março até maio o gráfico é decrescente.'
        ]
    },
    {
        number: 39,
        title: 'QUESTÃO 39',
        prompt: `Uma empresa de telefonia analisou a quantidade de atendimentos realizados por dia por um grupo de funcionários durante uma semana. Os dados coletados estão apresentados na tabela a seguir:<br><br>
        Quantidade de atendimentos por dia: 10, 11, 12, 13, 14<br>
        Número de funcionários: 3, 7, 5, 3, 2.<br><br>
        Dessa forma, a média aritmética e a mediana da quantidade diária de atendimentos realizados por funcionário foram, respectivamente,`,
        graphic: {
            type: 'none'
        },
        options: [
            '10,5 e 11,5',
            '11,5 e 11,5',
            '11,7 e 11,5',
            '10,5 e 11,7',
            '11,7 e 11,7'
        ]
    },
    {
        number: 40,
        title: 'QUESTÃO 40',
        prompt: `Um laboratório está ajustando as concentrações de duas soluções químicas. A solução A tem pH de −1,8 e a solução B tem pH de 3,2. Para testar a estabilidade, um técnico deve calcular o valor S = (pH_A − pH_B) · (2 + 5/7) + (−3,4 + 5/7). Dessa forma, o valor correto de S é igual a`,
        graphic: {
            type: 'none'
        },
        options: [
            '16,5',
            '18,5',
            '20,5',
            '22,5',
            '24,5'
        ]
    },
    {
        number: 41,
        title: 'QUESTÃO 41',
        prompt: `Uma escola realizou uma pesquisa para analisar quantas horas, por semana, seus alunos do 3º ano dedicam ao estudo fora da sala de aula. Os 12 alunos dessa turma responderam com os seguintes valores (em horas): 4, 6, 5, 8, 10, 6, 7, 9, 4, 4, 8, 12. O coordenador pedagógico deseja escolher a medida de tendência central que melhor represente o comportamento geral da turma, evitando que valores extremos influenciem o resultado.`,
        graphic: {
            type: 'none'
        },
        options: [
            'média',
            'mediana',
            'moda',
            'amplitude',
            'variância'
        ]
    },
    {
        number: 42,
        title: 'QUESTÃO 42',
        prompt: `Um dos critérios de segurança adotados por uma agência de turismo que oferece passeios a uma ilha é estabelecer uma idade mínima para a visitação, a qual pode ser obtida dividindo-se a menor raiz da equação (x − 37)² − 169 = 0 por 2. Qual é a idade mínima para visitação?`,
        graphic: {
            type: 'none'
        },
        options: [
            '10',
            '12',
            '24',
            '25',
            '30'
        ]
    },
    {
        number: 43,
        title: 'QUESTÃO 43',
        prompt: `Um engenheiro estava analisando as plantas dos projetos de dois empreendimentos. Nos projetos, as áreas de construção eram quadradas, mas possuíam dimensões diferentes, e haviam sido divididas em regiões retangulares, como mostra a imagem a seguir. Após calcular as áreas de construção dos empreendimentos, o engenheiro verificou que a soma dessas áreas poderia ser representada por`,
        graphic: {
            type: 'none'
        },
        options: [
            '3a² + 26b²',
            '(2a + 6b)²',
            '4a² + 36b²',
            '(2a + 5b)² − (a + b)²',
            '2 · [(a + 3b)² + 4b²]'
        ]
    },
    {
        number: 44,
        title: 'QUESTÃO 44',
        prompt: `Um grupo de 4 nadadores atravessa uma piscina, que tem 20 m de um lado a outro, com tempos individuais de 12 s, 15 s, 18 s e 25 s. Esses atletas iniciaram um treino, de um mesmo lado da piscina, atravessando-a de um lado para outro continuamente. Quando chegam a um lado da piscina, eles imediatamente passam a nadar em direção ao lado oposto. A primeira vez em que os quatro nadadores chegaram, ao mesmo tempo, em um mesmo lado da piscina, o nadador mais rápido terá nadado um total de`,
        graphic: {
            type: 'none'
        },
        options: [
            '1000 m',
            '2000 m',
            '2500 m',
            '1500 m',
            '3000 m'
        ]
    },
    {
        number: 45,
        title: 'QUESTÃO 45',
        prompt: `Diego quer contratar um plano de telefone e internet para seu estabelecimento comercial. Ele entrou em contato com duas operadoras e obteve duas propostas distintas.<br><br>
        Empresa A — Valor fixo de R$ 50,00, com acréscimo de R$ 0,40 por minuto utilizado;<br>
        Empresa B — Valor fixo de R$ 72,50, com acréscimo de R$ 0,25 por minuto utilizado.<br><br>
        Quantos minutos devem ser usados no estabelecimento de Diego, para que o preço pago por ele seja o mesmo nas duas empresas?`,
        graphic: {
            type: 'none'
        },
        options: [
            '150',
            '180',
            '200',
            '220',
            '250'
        ]
    }
];

const simuladoState = simuladoQuestions.map(() => ({
    selectedOption: null,
    flagged: false
}));

let timerInterval;
let timeLeft = 210 * 60; // 3h30 em segundos, será ajustado
let startTime = Date.now();
const SIMULADO_ID = 'simulado1';
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

function updateProgressBar() {
    const totalQuestions = 45; // Total fixo de questões
    const answered = simuladoState.filter(state => state.selectedOption !== null).length;
    const percentage = (answered / totalQuestions) * 100;
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
}

function createOptionItem(letter, text, optionIndex) {
    const article = document.createElement('article');
    article.className = 'alternativa';
    article.dataset.optionIndex = optionIndex;
    article.innerHTML = `
        <span class="alternativa-letra">${letter}</span>
        <p>${text}</p>
    `;
    return article;
}

function updateFlagButton(index) {
    const flagButton = document.getElementById('btn-flag');
    if (!flagButton) return;
    const isFlagged = simuladoState[index]?.flagged;
    flagButton.textContent = isFlagged ? 'Remover Revisão' : 'Marcar para Revisão';
    flagButton.classList.toggle('flagged-active', isFlagged);
}

function updateMapItemStatus(index) {
    document.querySelectorAll('.mapa-item').forEach(button => {
        const buttonIndex = Number(button.textContent) - 1;
        if (Number.isNaN(buttonIndex)) return;

        const state = simuladoState[buttonIndex];
        if (!state) {
            button.classList.remove('respondida', 'flagged');
            return;
        }

        button.classList.toggle('respondida', state.selectedOption !== null);
        button.classList.toggle('flagged', state.flagged);
    });
}

function saveProgress(useBeacon = false) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const responses = simuladoState.map((state, index) => ({
        questionIndex: index,
        selectedOption: state.selectedOption !== null ? OPTION_LETTERS[state.selectedOption] : null,
        flagged: state.flagged
    }));

    const payload = JSON.stringify({ responses, timeSpent });
    const url = `/api/simulado/${SIMULADO_ID}/save-progress`;

    if (useBeacon && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
    }

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: payload,
        keepalive: true
    }).catch(err => console.error('Erro ao salvar progresso:', err));
}

function selectOption(questionIndex, optionIndex) {
    const currentSelected = simuladoState[questionIndex].selectedOption;
    simuladoState[questionIndex].selectedOption = currentSelected === optionIndex ? null : optionIndex;
    setActiveQuestion(questionIndex);
    updateMapItemStatus(questionIndex);
    updateProgressBar();
    saveProgress();
}

function toggleFlag(questionIndex) {
    simuladoState[questionIndex].flagged = !simuladoState[questionIndex].flagged;
    updateFlagButton(questionIndex);
    updateMapItemStatus(questionIndex);
    saveProgress();
}

function setActiveQuestion(index) {
    const currentQuestion = simuladoQuestions[index] || null;
    const indice = document.getElementById('questao-indice');
    const enunciadoTexto = document.getElementById('enunciado-texto');
    const graficoPlaceholder = document.getElementById('grafico-placeholder');
    const alternativasCard = document.getElementById('alternativas-card');

    if (!currentQuestion) {
        indice.textContent = `Questão ${index + 1} de 45`;
        enunciadoTexto.innerHTML = `<p>Questão não disponível.</p>`;
        graficoPlaceholder.innerHTML = '';
        alternativasCard.innerHTML = '';
        updateFlagButton(index);
        return;
    }

    indice.textContent = `${currentQuestion.title} de 45`;
    enunciadoTexto.innerHTML = currentQuestion.prompt;
    
    // Tratamento da imagem da questão
    if (currentQuestion.graphic && currentQuestion.graphic.type !== 'none') {
        const imageUrl = `/api/image/Simulados/Simulado1/Q${currentQuestion.number}.png`;
        graficoPlaceholder.innerHTML = `
            <div class="questao-imagem-container">
                <img src="${imageUrl}" alt="Imagem da Questão ${currentQuestion.number}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 15px 0;">
            </div>
        `;
    } else {
        graficoPlaceholder.innerHTML = '';
    }

    alternativasCard.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const selectedOption = simuladoState[index].selectedOption;

    currentQuestion.options.forEach((optionText, optionIndex) => {
        const optionItem = createOptionItem(letters[optionIndex], optionText, optionIndex);
        if (selectedOption === optionIndex) {
            optionItem.classList.add('selecionada');
        }
        optionItem.addEventListener('click', () => {
            selectOption(index, optionIndex);
        });
        alternativasCard.appendChild(optionItem);
    });

    updateFlagButton(index);
    updateMapItemStatus(index);
}

function updateMapActive(index) {
    document.querySelectorAll('.mapa-item').forEach(button => {
        button.classList.toggle('ativo', Number(button.textContent) - 1 === index);
    });
}

let currentIndex = 0;

function initSimulado1() {
    const prevButton = document.querySelector('.btn-prev');
    const nextButton = document.querySelector('.btn-next');
    const flagButton = document.getElementById('btn-flag');
    const mapButtons = Array.from(document.querySelectorAll('.mapa-item'));

    setActiveQuestion(currentIndex);
    updateMapActive(currentIndex);

    prevButton.addEventListener('click', () => {
        if (currentIndex === 0) return;
        currentIndex -= 1;
        setActiveQuestion(currentIndex);
        updateMapActive(currentIndex);
    });

    nextButton.addEventListener('click', () => {
        if (currentIndex >= simuladoQuestions.length - 1) return;
        currentIndex += 1;
        setActiveQuestion(currentIndex);
        updateMapActive(currentIndex);
    });

    mapButtons.forEach(button => {
        const questionNumber = Number(button.textContent);
        if (questionNumber > simuladoQuestions.length) {
            button.classList.add('indisponivel');
            button.disabled = true;
            return;
        }

        button.addEventListener('click', () => {
            currentIndex = questionNumber - 1;
            setActiveQuestion(currentIndex);
            updateMapActive(currentIndex);
        });
    });

    updateMapItemStatus();
}

function startTimer() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;

    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitSimulado();
        }
    }, 1000);
}

function submitSimulado() {
    clearInterval(timerInterval);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const responses = simuladoState.map((state, index) => ({
        questionIndex: index,
        selectedOption: state.selectedOption !== null ? OPTION_LETTERS[state.selectedOption] : null,
        flagged: state.flagged
    }));

    fetch(`/api/simulado/${SIMULADO_ID}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ responses, timeSpent })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(`Simulado submetido! Pontuação: ${data.score}/${data.percentage.toFixed(1)}%`);
            window.location.href = '/modulos.html'; // Redirecionar para home ou página de resultados
        }
    })
    .catch(err => {
        console.error('Erro ao submeter:', err);
        alert('Erro ao submeter simulado');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Buscar status do simulado
    try {
        const res = await fetch(`/api/simulado/${SIMULADO_ID}/status`, { credentials: 'include' });
        const status = await res.json();

        if (status.submitted) {
            alert('Você já submeteu este simulado.');
            window.location.href = '/modulos.html';
            return;
        }

        if (status.started) {
            // Calcular tempo restante
            const startedAt = new Date(status.startedAt).getTime();
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const totalLimit = status.timeLimit * 60;
            timeLeft = Math.max(0, totalLimit - elapsed);
            startTime = startedAt;

            // Buscar progresso salvo
            try {
                const progressRes = await fetch(`/api/simulado/${SIMULADO_ID}/results`, { credentials: 'include' });
                if (progressRes.ok) {
                    const progress = await progressRes.json();
                    if (progress.responses) {
                        progress.responses.forEach(r => {
                            const selectedOption = r.selectedOption;
                            const selectedIndex = typeof selectedOption === 'number'
                                ? selectedOption
                                : typeof selectedOption === 'string'
                                    ? OPTION_LETTERS.indexOf(selectedOption)
                                    : -1;

                            simuladoState[r.questionIndex] = {
                                selectedOption: selectedIndex >= 0 ? selectedIndex : null,
                                flagged: r.flagged
                            };
                        });
                    }
                }
            } catch (err) {
                console.error('Erro ao buscar progresso:', err);
            }
        } else {
            // Iniciar novo
            const startRes = await fetch(`/api/simulado/${SIMULADO_ID}/start`, {
                method: 'POST',
                credentials: 'include'
            });
            const startData = await startRes.json();
            if (startData.error) {
                alert(startData.error);
                window.location.href = '/modulos.html';
                return;
            }
            startTime = new Date(startData.startedAt).getTime();
            timeLeft = startData.timeLimit * 60;
        }
    } catch (err) {
        console.error('Erro ao buscar status:', err);
        alert('Erro ao carregar simulado');
        return;
    }

    const flagButton = document.getElementById('btn-flag');
    if (flagButton) {
        flagButton.addEventListener('click', () => {
            toggleFlag(currentIndex);
        });
    }

    const submitButton = document.getElementById('btn-submit');
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja finalizar o simulado?')) {
                submitSimulado();
            }
        });
    }

    updateProgressBar();
    startTimer();
    initSimulado1();

    // Salvar progresso ao fechar/recarregar
    window.addEventListener('beforeunload', () => saveProgress(true));
});
