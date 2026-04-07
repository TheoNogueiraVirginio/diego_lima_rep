const docIds = ["Simulados/Simulado1/Q21.paint"];
// Wait, the front end requests `/api/image/Simulados/Simulado1/Q21.png`
const cleanDocId = "Simulados/Simulado1/Q21.png";
const baseNames = [cleanDocId.replace(/\.png$/i, '')];
// push permutations.
// then for `base` of allNamesToTest -> `Simulados/Simulado1/Q21` + `.paint`
// we check `images/` + `Simulados/Simulado1/Q21.paint`
// and it EXISTS!
