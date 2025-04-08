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

export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const formatDate = (date) => {
  if (!date) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
};

export const formatGroupName = (groupName) => {
  if (!groupName) return "";
  const parts = groupName.split(" ");
  if (parts.length < 2) return groupName.toUpperCase();

  const [month, year] = parts;
  const monthName = month.charAt(0).toUpperCase() + month.slice(1);
  const shortYear = year ? year.slice(-2) : "";
  return `${monthName} ${shortYear}`;
};
export const formatChartDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit"
  }).replace(/ /g, "-");
};

