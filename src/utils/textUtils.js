export const formateQuestion = (content) => {
 
  const lines = content.split(/(\([a-dA-D1-9]\)|[a-dA-D1-9]\.|\s*[a-dA-D]\.)/g);

  let formattedText = lines[0].trim() + `<br />`;

  for (let i = 1; i < lines.length; i += 2) {
      formattedText += `<br />` + lines[i].trim(); 
      if (lines[i + 1]) {
          formattedText += ` ${lines[i + 1].trim()}`; 
      }
  }

  return formattedText;
};
