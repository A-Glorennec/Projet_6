// Ilmportation du modèle Sauce
const Sauce = require('../models/Sauce');

// File système pour modifier ou suppriler des fichiers
const fs = require('fs');

// Création d'une sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce sauvegardée' }))
    .catch(error => res.status(400).json({ error }))
  //console.log(sauce);
};

// Modification d'une sauce
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };
  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: 'Non autorisé' })
      } else {
        Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: "Sauce modifiée" }))
          .catch(error => res.status(400).json({ error }))
      }
    })
};

// Suppression d'une sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: 'Non autorisé' });
      } else {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => { res.status(200).json({ message: 'Sauce supprimée' }) })
            .catch(error => res.status(401).json({ error }));
        });
      }
    })
    .catch(error => {
      res.status(500).json({ error })
    });
};

// Récupération de toutes les sauces
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }))
};

// Récupération d'une seule sauce
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error }))
};

// Ajout d'un like ou dislike sur une sauce
exports.like = (req, res, next) => {
  const like = req.body.like;


  if (like === 1) {
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        //On regarde si l'utilisateur n'a pas déjà liké ou disliké la sauce
        if (sauce.usersDisliked.includes(req.body.userId) || sauce.usersLiked.includes(req.body.userId)) {
          res.status(401).json({ message: 'Non autorisé ' });
        } else {
          Sauce.updateOne({ _id: req.params.id }, {
            //Insère le userId dans le tableau usersLiked du modèle
            $push: { usersLiked: req.body.userId },
            //Ajoute le like
            $inc: { likes: +1 },
          })
            .then(() => res.status(200).json({ message: 'Like !' }))
            .catch((error) => res.status(400).json({ error }));
        }
      })
      .catch((error) => res.status(404).json({ error }));
  };
  if (like === -1) {
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        //On regarde si l'utilisateur n'a pas déjà liké ou disliké la sauce
        if (sauce.usersDisliked.includes(req.body.userId) || sauce.usersLiked.includes(req.body.userId)) {
          res.status(401).json({ message: 'Non autorisé !' });
        } else {
          Sauce.updateOne({ _id: req.params.id }, {
            //Insère le userId dans le tableau usersLiked du modèle
            $push: { usersDisliked: req.body.userId },
            //Ajoute le dislike
            $inc: { dislikes: +1 },
          })
            .then(() => res.status(200).json({ message: 'Dislike !' }))
            .catch((error) => res.status(400).json({ error }));
        }
      })
      .catch((error) => res.status(404).json({ error }));
  };

  //RETIRER SON LIKE OU SON DISLIKE

  if (like === 0) {
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        //Regarde si le userId est déjà dans le tableau usersliked/disliked
        if (sauce.usersLiked.includes(req.body.userId)) {
          Sauce.updateOne({ _id: req.params.id }, {
            //Retire le userId dans le tableau usersliked du modèle
            $pull: { usersLiked: req.body.userId },
            //Retire le likes
            $inc: { likes: -1 },
          })
            .then(() => res.status(200).json({ message: 'Like retiré !' }))
            .catch((error) => res.status(400).json({ error }))
        };
        if (sauce.usersDisliked.includes(req.body.userId)) {
          Sauce.updateOne({ _id: req.params.id }, {
            //Retire le userId dans le tableau usersDisliked du modèle
            $pull: { usersDisliked: req.body.userId },
            //Retire le dislikes
            $inc: { dislikes: -1 },
          })
            .then(() => res.status(200).json({ message: 'Dislike retiré !' }))
            .catch((error) => res.status(400).json({ error }))
        };
      })
      .catch((error) => res.status(404).json({ error }));
  };
};







