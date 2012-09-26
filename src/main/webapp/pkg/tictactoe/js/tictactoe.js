if (!tictactoePkg) var tictactoePkg = {};

tictactoePkg["activate"] = function() {
    if (!this.toolbox) {
        this.toolbox = this.loadToolbox("TicTacToe", "tictactoe.html", function() {
            $("#toolboxClientButton").click(function() {
                var name = $("#toolboxClientName").val();
                tictactoePkg.setName(name);
            });
        });
    }
}

tictactoePkg["deactivate"] = function() {
    if (this.toolbox) {
        Toolbox.removePanel(this.toolbox);
        delete this.toolbox;
    }
}
