const daysBetween = (d1, d2) => {
    let date1 = d1;
    let date2 = d2;
    
    // Calculating the time difference
    // of two dates
    let Difference_In_Time =
        date2.getTime() - date1.getTime();
    
    // Calculating the no. of days between
    // two dates
    let Difference_In_Days = Math.round(Difference_In_Time / (1000 * 3600 * 24));
    return Difference_In_Days;
};

const daysLeft = (d1) => {
    let days = daysBetween(d1, new Date());
    if (days <= 0) {
        return 3;
    } else if (days > 3) {
        return 0;
    } else {
        return days;
    }
}


export default daysLeft;
  
