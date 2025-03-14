export const formateQuestion=(content)=> {
    const lines = content.split(/(\([a-d]\))/g);
    let formattedText = lines[0].trim()+`<br />`;
     
    for (let i = 1; i < lines.length; i += 2) {
      formattedText += `<br /> ${lines[i]} ${lines[i + 1].trim()}`; 
    }
    console.log("init text as:",content,"\n final:",formattedText);
    return formattedText;
  }