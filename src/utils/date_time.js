export const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min} min:${sec < 10 ? "0" : ""}${sec} sec`;
  };

