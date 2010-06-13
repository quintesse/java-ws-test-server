
function twinkle() {
    alert('twinkle');
}

function starbutton(pkg) {
    this.pkg = pkg;
    pkg.loadHtml("main.html", function(bodyData) {
        alert("starbutton");
    });
}

starbutton.prototype.createStar = new function() {
}