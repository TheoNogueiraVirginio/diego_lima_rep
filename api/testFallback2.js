const cleanDocId = "Simulados/Simulado1/Q24.png";
const bucketMock = {
    file: (f) => ({ exists: async () => [f === "images/Simulados/Simulado1/Q24.paint"] })
};
async function test() {
    let nomeArquivo = `images/${cleanDocId}`;
    let fileRef = bucketMock.file(nomeArquivo);

    const baseNames = [];
    baseNames.push(cleanDocId.replace(/\.png$/i, ''));
    
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
    
    const extensionsToTry = ['.paint', '.png', '.jpg', '.jpeg', '.PNG', '.JPG', ''];
    let found = false;

    for (let base of allNamesToTest) {
      for (let ext of extensionsToTry) {
        let tempArquivo = `${base}${ext}`;
        fileRef = bucketMock.file(`images/${tempArquivo}`);
        let [exists] = await fileRef.exists();
        if (exists) {
          nomeArquivo = `images/${tempArquivo}`;
          found = true;
          console.log(`FOUND IN PREFIX: ${nomeArquivo}`);
          break;
        }
      }
      if (found) break;
    }
}
test();
