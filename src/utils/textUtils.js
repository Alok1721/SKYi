export const formateQuestion=(content)=> {
    const lines = content.split(/(\([a-d]\))/g);
    let formattedText = lines[0].trim()+`<br />`;
     
    for (let i = 1; i < lines.length; i += 2) {
      const parts = lines[i + 1].split(':').map((part) => part.trim());
      formattedText += `<br /> ${lines[i]}`;
      formattedText += parts.join(`<br />`);
    }
    formattedText = formattedText.replace(/\b([1-9]\.)/g, '<br />$1');
    return formattedText;
  }