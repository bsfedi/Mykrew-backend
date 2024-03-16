const User = require('../models/userModel');
const NewMission = require('../models/newMissionModel');
const Preregister = require('../models/preRegistrationModel');
const jwt = require('jsonwebtoken');
const serviceJWT = require('../configuration/JWTConfig');
const bcrypt = require('bcrypt');
const { decode } = require("jsonwebtoken");
const { findMissionById } = require("../utils/utils")
const emailService = require('../services/emailService');

const fs = require('fs').promises;
const moment = require('moment');
const { log } = require('console');


exports.resetPassword = async (req, res) => {
  const { user_id } = req.params;
  const { newPassword } = req.body;

  try {
    // Find the user by user_id in MongoDB
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    // You might want to add additional logic here such as sending an email to notify the user about the password change

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
};
exports.sendForgotPasswordMail = async (req, res) => {
  // Extract email address from request
  const { email } = req.body;

  try {
    // Find the user by email in MongoDB
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Construct email message with the user's ID in the link
    const resetLink = `https://mykrew-frontend-hhyc.vercel.app/change-mot-de-passe/${user._id}`;

    // Construct email subject and HTML content
    const subject = 'Password Reset';
    const htmlContent = `<p>To reset your password, please click on the following link:</p><p><a href="${resetLink}">${resetLink}</a></p>`;

    // Send the email using your existing email service
    const emailSent = await emailService.sendEmail(email, subject, htmlContent);

    if (emailSent) {
      console.log('Email sent successfully');
      res.status(201).json({ message: 'Email sent successfully' });
    } else {
      console.error('Failed to send email');
      res.status(500).send('Failed to send email');
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.sendemailtoconsultant = async (req, res) => {
  // Extract email address from request
  const { email } = req.body;
  const { subject } = req.body;
  const { message } = req.body;

  try {
    // Find the user by email in MongoDB


    // Construct email message with the user's ID in the link

    // Construct email subject and HTML content

    const htmlContent = message
    // Send the email using your existing email service
    const emailSent = await emailService.sendEmail(email, subject, htmlContent);

    if (emailSent) {
      console.log('Email sent successfully');
      res.status(201).json({ message: 'Email sent successfully' });
    } else {
      console.error('Failed to send email');
      res.status(500).send('Failed to send email');
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    const preRegistration = new PreRegistration({ userId: newUser._id });
    await preRegistration.save();

    newUser.preRegister = preRegistration._id;

    await newUser.save();


    const token = jwt.sign({ userId: newUser._id, role: newUser.role, preRegistration: newUser.preRegister }, serviceJWT.jwtSecret, {
      expiresIn: serviceJWT.jwtExpiresIn,
    });
    const decoded = jwt.verify(token, serviceJWT.jwtSecret);


    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.craInformation = async (req, res) => {
  try {
    // Query all users
    const users = await User.find({});

    // Array to store users with craInformation
    const usersWithCraInformation = [];

    // Iterate over each user
    users.forEach(user => {
      // Iterate over user's missions
      user.missions.forEach(mission => {
        // Check if craInformation exists in the mission
        if (mission.craInformation && Object.keys(mission.craInformation).length !== 0) {
          // If craInformation exists, add firstname and lastname to the list
          usersWithCraInformation.push({
            firstName: user.personalInfo.firstName,
            lastName: user.personalInfo.lastName,
            craInformation: mission.craInformation
          });
        }
      });
    });

    // Send the response
    res.json(usersWithCraInformation);
  } catch (error) {
    // Handle errors
    console.error('Error fetching craInformation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }


    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isAvtivated) {
      const token = jwt.sign({ userId: user._id, role: user.role, preRegistration: user.preRegister }, serviceJWT.jwtSecret, {
        expiresIn: serviceJWT.jwtExpiresIn,
      });

      res.status(200).json({
        message: 'Login successful',
        token,
        role: user.role,
        id: user._id,
        image: user.image
      });
    }
    else {
      return res.status(401).json({ message: 'Votre compte a été désactivé , veuillez contacter l’admin' });
    }


  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

exports.createUserByAdmin = (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'Token non fourni' });
    }

    const decoded = jwt.verify(token, serviceJWT.jwtSecret);

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const { email, password, immat, firstName, lastName } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      role: 'RH',
      [`personalInfo.immatriculation`]: immat,
      [`personalInfo.firstName`]: firstName,
      [`personalInfo.lastName`]: lastName,
      ['personalInfo.phoneNumber']: '',
      ['personalInfo.location']: '',

    });

    newUser.save();

    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur par l\'admin:', error);
    res.status(500).json({ message: 'Échec de la création de l\'utilisateur' });
  }
};

exports.getMissionsByUserId = async (req, res) => {
  try {

    const userId = req.params.userId;

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const userMissions = user.missions;

    const newMissions = await NewMission.find({ userId });

    const transformedUserMissions = userMissions.map((mission) => ({
      missionInfo: {
        profession: mission.missionInfo.profession,
        industrySector: mission.missionInfo.industrySector,
        finalClient: mission.missionInfo.finalClient,
        dailyRate: mission.missionInfo.dailyRate,
        startDate: mission.missionInfo.startDate,
        endDate: mission.missionInfo.endDate,
        isSimulationValidated: mission.missionInfo.isSimulationValidated,
      },
      clientInfo: {
        company: mission.clientInfo.company,
        firstName: mission.clientInfo.clientContact.firstName,
        lastName: mission.clientInfo.clientContact.lastName,
        position: mission.clientInfo.clientContact.position,
        email: mission.clientInfo.clientContact.email,
        phoneNumber: mission.clientInfo.clientContact.phoneNumber,

      },
      _id: mission._id,
      contractProcess: mission.contractProcess,
      newMissionStatus: mission.newMissionStatus,
      validated_by: mission.validated_by
    }));


    const transformedNewMissions = newMissions.map((mission) => ({
      missionInfo: {
        profession: mission.missionInfo.profession.value,
        industrySector: mission.missionInfo.industrySector.value,
        finalClient: mission.missionInfo.finalClient.value,
        dailyRate: mission.missionInfo.dailyRate.value,
        startDate: mission.missionInfo.startDate.value,
        endDate: mission.missionInfo.endDate.value,
        isSimulationValidated: mission.missionInfo.isSimulationValidated.value,
      },
      clientInfo: {
        company: mission.clientInfo.company,
        firstName: mission.clientInfo.clientContact.firstName.value,
        lastName: mission.clientInfo.clientContact.lastName.value,
        position: mission.clientInfo.clientContact.position.value,
        email: mission.clientInfo.clientContact.email.value,
        phoneNumber: mission.clientInfo.clientContact.phoneNumber.value,
      },
      _id: mission._id,
      userId: mission.userId,
      contractProcess: mission.contractProcess,
      newMissionStatus: mission.newMissionStatus,
      validated_by: mission.validated_by,
      __v: mission.__v,
    }));

    const allMissions = [...transformedUserMissions, ...transformedNewMissions];

    res.status(200).json(allMissions);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.getMissionByMissionId = async (req, res) => {
  try {
    const missionId = req.params.newMissionId;
    const newMission = await NewMission.findById(missionId);

    if (!newMission) {
      const users = await User.find({});
      for (const user of users) {
        const mission = user.missions.find(mission => mission._id == missionId);
        if (mission) {
          return res.status(200).send(mission);
        }
      }
    }

    return res.status(200).send(newMission);
  } catch (error) {
    return res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des missions.' });
  }
};

exports.getMissionsByJWT = async (req, res) => {

  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Token non fourni' });
  }
  const decoded = jwt.verify(token, serviceJWT.jwtSecret);
  const userId = decoded.userId;
  const user = await User.findOne({ _id: userId });

  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }

  const userMissions = user.missions;

  const newMissions = await NewMission.find({ userId });

  const transformedUserMissions = userMissions.map((mission) => ({
    missionInfo: {
      profession: mission.missionInfo.profession,
      industrySector: mission.missionInfo.industrySector,
      finalClient: mission.missionInfo.finalClient,
      dailyRate: mission.missionInfo.dailyRate,
      startDate: mission.missionInfo.startDate,
      endDate: mission.missionInfo.endDate,
      isSimulationValidated: mission.missionInfo.isSimulationValidated,
    },
    clientInfo: {
      company: mission.clientInfo.company,
      firstName: mission.clientInfo.clientContact.firstName,
      lastName: mission.clientInfo.clientContact.lastName,
      position: mission.clientInfo.clientContact.position,
      email: mission.clientInfo.clientContact.email,
      phoneNumber: mission.clientInfo.clientContact.phoneNumber,

    },
    _id: mission._id,
    contractProcess: mission.contractProcess,
    newMissionStatus: mission.newMissionStatus,
  }));


  const transformedNewMissions = newMissions.map((mission) => ({
    missionInfo: {
      profession: mission.missionInfo.profession.value,
      industrySector: mission.missionInfo.industrySector.value,
      finalClient: mission.missionInfo.finalClient.value,
      dailyRate: mission.missionInfo.dailyRate.value,
      startDate: mission.missionInfo.startDate.value,
      endDate: mission.missionInfo.endDate.value,
      isSimulationValidated: mission.missionInfo.isSimulationValidated.value,
    },
    clientInfo: {
      company: mission.clientInfo.company,
      firstName: mission.clientInfo.clientContact.firstName.value,
      lastName: mission.clientInfo.clientContact.lastName.value,
      position: mission.clientInfo.clientContact.position.value,
      email: mission.clientInfo.clientContact.email.value,
      phoneNumber: mission.clientInfo.clientContact.phoneNumber.value,
    },
    _id: mission._id,
    userId: mission.userId,
    newMissionStatus: mission.newMissionStatus,
    __v: mission.__v,
  }));

  const allMissions = [...transformedUserMissions, ...transformedNewMissions];

  res.status(200).json(allMissions);

};

exports.getPersonnalInfoByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    console.log(user);
    const userPersonalInfo = {
      ...user.personalInfo,
      isAvtivated: user.isAvtivated
    };
    const hasNonEmptyProperties = Object.values(userPersonalInfo)
      .some(value => typeof value === 'string' && value.trim() !== '');

    if (!hasNonEmptyProperties) {
      return res.status(404).json({ error: "Personal info not validated yet" });
    } else {
      return res.status(200).json(userPersonalInfo);
    }

  } catch (e) {
    return res.status(500).json(e);
  }
};

exports.getPreregisterByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const preregister = await Preregister.findOne({ userId: userId });

    if (!preregister) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    return res.status(200).send(preregister)

  } catch (e) {
    return res.status(500).json(e);
  }
};

exports.addDocumentToUser = async (req, res) => {
  const userId = req.params.userId;

  const files = req.files;

  const userDocumentFile = files.userDocument ? files.userDocument[0] : null;

  if (!userDocumentFile) {
    return res.status(400).json({ message: 'No userDocument file provided' });
  }

  const userDocumentFilename = userDocumentFile.filename;
  const documentName = req.body.documentName;
  const documentData = {
    documentName: documentName,
    document: userDocumentFilename
  };

  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.addDocument(documentData);

    return res.status(200).json({ message: 'Document added successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

};

exports.getAllDocuments = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allDocuments = user.userDocuments.map(doc => ({
      _id: doc._id,
      documentName: doc.documentName,
      document: doc.document,
      createdAt: doc.createdAt
    }));

    //user.missions.forEach(mission => {
    //  if (mission.craInformation.craPDF) {
    //    allDocuments.push({
    //      _id: mission._id,
    //      documentName: `CRA PDF - Mission ${mission._id}`,
    //      document: mission.craInformation.craPDF,
    //      createdAt: new Date()
    //    });
    //  }
    //});

    res.status(200).json(allDocuments);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.editIdentificationDocument = async (req, res) => {
  const userId = req.params.userId;

  const files = req.files;
  const identificationDocumentFilename = files.identificationDocument ? files.identificationDocument[0].filename : null;

  await User.findById({ _id: userId }).then(async user => {
    const oldFileName = user.personalInfo.identificationDocument
    if (oldFileName) {
      try {
        const filePath = `uploads/${oldFileName}`;
        await fs.unlink(filePath);
      } catch (e) {
        console.log("hello")
      }

    }
    user.personalInfo.identificationDocument = identificationDocumentFilename;
    await user.save().then(userr => {
      return res.status(200).send(user)
    }).catch(error => {
      return res.status(500).send({ error: error })
    })


  }).catch(error => {
    return res.status(500).send({ error: error })
  })
}

exports.editDrivingLiscence = async (req, res) => {
  const userId = req.params.userId;

  const files = req.files;
  const drivingLicenseFilename = files.drivingLicense ? files.drivingLicense[0].filename : null;

  await User.findById({ _id: userId }).then(async user => {
    const oldFileName = user.personalInfo.carInfo.drivingLicense
    if (oldFileName) {
      try {
        const filePath = `uploads/${oldFileName}`;
        await fs.unlink(filePath);
      } catch (e) {
        console.log("hello")
      }

    }
    user.personalInfo.carInfo.drivingLicense = drivingLicenseFilename;
    await user.save().then(userr => {
      return res.status(200).send(user)
    }).catch(error => {
      return res.status(500).send({ error: error })
    })


  }).catch(error => {
    return res.status(500).send({ error: error })
  })
}

exports.editRibDocument = async (req, res) => {
  const userId = req.params.userId;

  const files = req.files;
  const ribDocumentFilename = files.ribDocument ? files.ribDocument[0].filename : null;

  await User.findById({ _id: userId }).then(async user => {
    const oldFileName = user.personalInfo.ribDocument
    if (oldFileName) {
      try {
        const filePath = `uploads/${oldFileName}`;
        await fs.unlink(filePath);
      } catch (e) {
        console.log("hello")
      }

    }
    user.personalInfo.ribDocument = ribDocumentFilename;
    await user.save().then(userr => {
      return res.status(200).send(user)
    }).catch(error => {
      return res.status(500).send({ error: error })
    })


  }).catch(error => {
    return res.status(500).send({ error: error })
  })
}

exports.getMonthlyStatsForAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find();

    const yearlyData = Array(12).fill(0);

    const currentYear = new Date().getFullYear();

    for (const user of allUsers) {
      const userMissions = [...user.missions];

      const newMissions = await NewMission.find({ userId: user._id });
      userMissions.push(...newMissions);

      userMissions.forEach(mission => {
        const startDate = new Date(mission.missionInfo.startDate);
        const endDate = new Date(mission.missionInfo.endDate);

        if (startDate && endDate) {
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth();
          const endYear = endDate.getFullYear();
          const endMonth = endDate.getMonth();
          const tjm = mission.missionInfo.dailyRate || 0;

          if (startYear === currentYear || endYear === currentYear) {
            for (let i = startMonth; i <= endMonth; i++) {
              yearlyData[i] += tjm * 20;
            }
          }
        }
      });
    }

    const categories = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return `${month}/${currentYear}`;
    });

    const stats = {
      series: [{ data: yearlyData }],
      categories: categories,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getConsultantStats = async (req, res) => {
  try {
    const users = await User.find({ role: 'CONSULTANT' });


    let numberOfConsultants = users.length;
    let numberOfMissions = 0;
    let totalTJM = 0;
    let totalRevenue = 0;

    const today = new Date();
    const startOfYear = moment().startOf('year').toDate();

    users.forEach(user => {
      if (user.missions && user.missions.length > 0) {


        user.missions.forEach(mission => {
          numberOfMissions++;
          const startDate = new Date(mission.missionInfo.startDate);
          const endDate = new Date(mission.missionInfo.endDate);

          if (startDate <= today && today <= endDate) {
            const tjm = mission.missionInfo.dailyRate;
            totalTJM += tjm;

            if (startDate >= startOfYear) {
              totalRevenue += tjm;
            }
          }
        });
      }
    });

    console.log(numberOfMissions)
    const averageTJM = numberOfConsultants > 0 ? totalTJM / numberOfMissions : 0;

    return res.status(200).json({
      numberOfConsultants: numberOfConsultants,
      averageTJM: averageTJM,
      totalRevenue: totalRevenue
    });
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques des consultants :', error);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
}

exports.updateCraInformations = async (req, res) => {

  const missionId = req.params.missionId
  const files = req.files;

  const signatureFilename = files.signature ? files.signature[0].filename : null;

  const datesString = req.body.selectedDates;
  const datesArray = JSON.parse(datesString);

  const convertedDates = datesArray.map(dateObj => {
    const year = new Date().getFullYear();
    const month = dateObj.month;
    const day = dateObj.day;

    const date = new Date(year, month, day);

    return { date: date };
  });

  console.log(convertedDates);


  try {
    await User.updateOne({ "missions._id": missionId }, {
      $set: {
        "missions.$.craInformation.selectedDates": convertedDates,
        "missions.$.craInformation.signature": signatureFilename,
        "missions.$.craInformation.noteGlobale": req.body.noteGlobale,
      }
    }).then(cra => {
      res.status(200).json({ message: 'CRA information updated successfully for all users.' });
    }).catch(e => {
      res.status(300).json({ message: e });
    });


  } catch (error) {
    console.error('Error updating CRA information:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}


exports.getCraInformations = async (req, res) => {
  try {
    const missionId = req.params.missionId;

    const user = await User.findOne(
      { "missions._id": missionId },
      { "missions.$": 1 } // Projection to get only the matched mission
    );

    if (!user || !user.missions || user.missions.length === 0) {
      return res.status(404).json({ message: 'Mission not found in any user.' });
    }

    const craInformation = user.missions[0].craInformation;

    // Transform selectedDates to the desired format
    const transformedDates = craInformation.selectedDates.map(dateObj => {
      const date = new Date(dateObj.date);
      return { day: date.getDate(), month: date.getMonth() };
    });

    res.status(200).json({ craInformation: { ...craInformation, selectedDates: transformedDates } });
  } catch (error) {
    console.error('Error retrieving CRA information:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getRhUsers = async (req, res) => {
  try {
    await User.find({ role: "RH" }).then(users => {
      if (users.length === 0) {
        return res.status(404).send("users not found !")

      } else {
        return res.status(200).send(users)
      }

    })
  } catch (e) {
    return res.status(500).send("server error")

  }
}

exports.getConsultantUsers = async (req, res) => {
  try {
    await User.find({ role: "CONSULTANT" }).then(users => {
      if (users.length === 0) {
        return res.status(404).send("users not found !")

      } else {
        return res.status(200).send(users)
      }

    })
  } catch (e) {
    return res.status(500).send("server error")

  }
}

exports.updateUserByAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: 'Token non fourni' });
    }
    try {
      const decoded = jwt.verify(token, serviceJWT.jwtSecret);
      if (decoded.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(301).json({ message: 'Token expiré' });
      }
      return res.status(500).json({ message: 'Erreur lors de la vérification du token' });
    }

    const userId = req.params.userId;
    const body = req.body;


    await User.findOneAndUpdate({ _id: userId },
      {
        [`personalInfo.immatriculation`]: body.immatriculation,
        [`personalInfo.firstName`]: body.firstName,
        [`personalInfo.lastName`]: body.lastName,
        email: body.email
      },
      { new: true }
    ).then(updatedUser => {
      if (!updatedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      return res.status(200).json(updatedUser);
    }).catch(error => {
      res.status(500).json({ message: error.message });
    })

  } catch (error) {
    res.status(500).json({ message: 'Échec de la création de l\'utilisateur' });
  }
};

exports.updateAccountVisibility = async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Token non fourni' });
  }
  try {
    const decoded = jwt.verify(token, serviceJWT.jwtSecret);
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(301).json({ message: 'Token expiré' });
    }
    return res.status(500).json({ message: 'Erreur lors de la vérification du token' });
  }

  const activated = req.body.activated;
  const userId = req.params.userId;

  await User.findOneAndUpdate({ _id: userId },
    { isAvtivated: activated },
    { new: true }).then(updatedUser => {
      if (!updatedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      return res.status(200).json(updatedUser);
    }).catch(error => {
      res.status(500).json({ message: error.message });
    })
}

exports.addPDFtoUser = async (req, res) => {
  try {
    const missionId = req.params.missionId;
    const files = req.files;
    const craPdfFilename = files.craPdf ? files.craPdf[0].filename : null;

    // Add the current date
    const currentDate = new Date();

    const updatedUser = await User.findOneAndUpdate(
      { "missions._id": missionId },
      {
        $push: {
          "missions.$.craInformation.craPDF": {
            filename: craPdfFilename,
            uploadDate: currentDate
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    const updatedMission = updatedUser.missions.find(
      (mission) => mission._id.toString() === missionId
    );

    res.status(200).json(updatedMission.craInformation.craPDF);
  } catch (error) {
    console.error('Error updating CRA information:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


exports.getAllCras = async (req, res) => {

  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const craPdfs = user.missions.reduce((pdfs, mission) => {
      return pdfs.concat(mission.craInformation.craPDF);
    }, []);

    res.status(200).json({ craPdfs });
  } catch (error) {
    console.error('Error fetching craPDFs:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}