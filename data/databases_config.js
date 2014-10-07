var usersConfig = {
    views: {
        all :{
            map: function(doc) {
                return emit(doc._id, doc);
            }
        },
        noobs: {
            map: function(doc) {
                if (doc.level && doc.level < 5) {
                    return emit(doc._id, doc);
                }
            }
        },

        advanced: {
            map: function(doc) {
                if (doc.level && doc.level >= 5 && doc.level < 10){
                    return emit(doc._id, doc);
                }
            }
        }
    }
};

var charactersConfig = {
    views: {
        all :{
            map: function(doc) {
                return emit(doc._id, doc);
            }
        }
    }
};

var objectsConfig = {
    views: {
        all :{
            map: function(doc) {
                return emit(doc._id, doc);
            }
        }
    }
};

var skillsConfg = {
    views: {
        all :{
            map: function(doc) {
                return emit(doc._id, doc);
            }
        }
    }
};

module.exports = {
    users: usersConfig,
    characters: charactersConfig,
    objects: objectsConfig,
    skills: skillsConfg
};
