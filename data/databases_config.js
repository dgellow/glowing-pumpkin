var usersConfig = {
    views: {
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
    views: {}
};

var objectsConfig = {
    views: {}
};

var skillsConfg = {
    views: {}
};

module.exports = {
    users: usersConfig,
    characters: charactersConfig,
    objects: objectsConfig,
    skills: skillsConfg
};
