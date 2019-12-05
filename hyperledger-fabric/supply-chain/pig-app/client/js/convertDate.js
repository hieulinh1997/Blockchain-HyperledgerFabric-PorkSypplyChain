//Ham xu li thoi gian
function cutStringDate(str) {
    var n = str.search(",");
    var result = str.slice(0, n);
    return result;
}
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}
// Jan 2019
function formatDate(date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];
    var minutes = date.getMinutes();
    var hours = date.getHours();
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    return day + ' ' + monthNames[monthIndex] + ' ' + year + ', ' + hours + ':' + minutes;
}
//format date
function convertTime(date) {
    var timeLabel = formatDate(new Date(cutStringDate(date)));
    return timeLabel;
}