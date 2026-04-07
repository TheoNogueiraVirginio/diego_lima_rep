const cleanDocId = "Simulados/Simulado1/Q11.png";
const baseNames = [cleanDocId.replace(/\.png$/i, '')];
const qMatch = cleanDocId.match(/(.*\/)(Q|q)(\d+)\.png$/i);
if (qMatch) {
    const path = qMatch[1]; 
    const qLevel = qMatch[2]; 
    const num = qMatch[3]; 

    if (num.length === 1) {
        baseNames.push(`${path}${qLevel}0${num}`);
        baseNames.push(`${path}q0${num}`);
        baseNames.push(`${path}Q0${num}`);
    }

    baseNames.push(`${path}q${num}`);
    baseNames.push(`${path}Q${num}`);
}
const lowerDirsNames = baseNames.map(n => n.toLowerCase());
const allNamesToTest = [...new Set([...baseNames, ...lowerDirsNames])];
console.log(allNamesToTest);
