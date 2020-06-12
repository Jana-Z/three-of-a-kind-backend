class Player {
    constructor(id){
        this.score = 0;
        this.game =  '';
        this.name =  '';
        this.id = id;
    }

    setName(name) {
        this.name = name;
    }

    incrScore() {
        this.score ++;
    }

    getId() {
        return this.id;
    }

    getName(){
        return this.name;
    }

    getScore() {
        return this.score;
    }
}

module.exports = Player;