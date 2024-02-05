import express from 'express'
import nunjucks from 'nunjucks'
import { DateTime } from "luxon"
import cookieSession from 'cookie-session'

import {User, trackData, sequelize, Op} from './db.js'

import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import * as AdminJSSequelize from '@adminjs/sequelize'

AdminJS.registerAdapter({
    Resource: AdminJSSequelize.Resource,
    Database: AdminJSSequelize.Database,
})

// DATABASE SYNC
try {
    await sequelize.authenticate()
    
    await sequelize.sync({ alter: true })
    console.log("All models were synchronized successfully.")

    // SUPERADMIN
    await User.findOrCreate({ 
        where: {
            username: 'admin'
        }, 
        defaults: { 
            username: 'admin', 
            password: 'admin',
            userType: 1,
            firstname: 'Admin',
            lastname: 'User'
        } 
    })
} catch (error) {
    console.log(error)
}

const app = express()

const admin = new AdminJS({resources: [User]})
const adminRouter = AdminJSExpress.buildRouter(admin)

const env = nunjucks.configure('./', {
    autoescape: true,
    express: app
});

const date = function(date) {
    const dt = DateTime.fromISO(date)
    return dt.toFormat('dd/MM/yyyy HH:mm')
}

env.addFilter('date', date)

app.use(cookieSession({
  name: 'session',
  secret: 'akdjnckdyrmcbd5f52ddjdjd',

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use(express.urlencoded({extended: true}))

app.use((req, res, next) => {
    if (req.path == '/login') {
        next()
        return
    }
    
    if (!req.session.user) {
        res.redirect('/login')
    }else{

        // protect adminjs
        if ((req.path.startsWith('/admin')) && (req.session.user.userType !== 1)) {
            res.redirect('/')
            return
        }

        next()
    }
}) 

app.use(admin.options.rootPath, adminRouter)

app.get('/', async (req, res) => {
    
    const user = req.session.user.id
    const data = await trackData.findAll({
        where: {user},
        raw: true
    })
    
    const ctx = {user: req.session.user, data}
    
    res.render('xcontent.njk', ctx)
})

app.post('/', async (req, res) => {
    
    const seker = req.body.seker
    const tansiyon = req.body.tansiyon
    const kolestrol = req.body.kolestrol
    const user = req.session.user.id

    const record = await trackData.create({ seker, tansiyon, kolestrol, date: DateTime.now(), user });

    const data = await trackData.findAll({
        where: {user},
        raw: true
    })

    const ctx = {user: req.session.user, data}
    
    res.render('xcontent.njk', ctx)
})

app.get('/login', (req, res) => {
    res.render('xlogin.njk')
})

app.post('/login', async (req, res) => {

    // check user
    const user = await User.findOne({ where: {
        [Op.and]: [
          { username: req.body.username },
          { password: req.body.password }
        ]
      },
      raw: true
    })
    
    if (user === null) {
        console.log('Not found!')
        res.render('xlogin.njk')
    } else {
        delete user.password;
        req.session.user = user
        res.redirect('/')
    } 
})

app.get('/logout', (req, res) => {
    req.session=null
    res.redirect('/login')
})

app.get('/delete/:id', async (req, res) => {
    const user = req.session.user.id
    const id = parseInt(req.params['id'])

    if (id) {
        console.log('DELETE ' + id)
        
        try {
            await trackData.destroy({
                where: {
                    [Op.and]: [
                        { user },
                        { id }
                    ]
                }
            })

            res.sendStatus(200)

        } catch (error) {
            console.log(error)
            res.sendStatus(200)
        }
    }

})



// LISTENS
const appPort = 2024  // env.APP_PORT
app.listen(appPort, () => {
    console.log(`Server listen as port: ${appPort}`);
})

