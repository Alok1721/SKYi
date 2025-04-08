export const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min} min:${sec < 10 ? "0" : ""}${sec} sec`;
  };

export const formatDateTime=(timeStamp)=>{  
  try {
    const date = new Date(timeStamp);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid timestamp");
    }
    const day = date.getDate().toString().padStart(2, "0"); 
    const month = date.toLocaleString("en-US", { month: "short" }); 
    const year = date.getFullYear().toString().slice(-2);
    const time = date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
    return `${day} ${month} '${year} - ${time}`;
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return timeStamp; 
  }
};

