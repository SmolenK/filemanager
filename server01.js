var express = require("express")
var app = express()
var PORT = process.env.PORT || 3000; 
var path = require("path")
var formidable = require('formidable')
var hbs = require('express-handlebars')

app.use(express.static('static'))

app.set('views', path.join(__dirname, 'views'))
app.engine('hbs', hbs({
    defaultLayout: 'main01.hbs',
    extname: '.hbs',
    partialsDir: "views/partials",
})) 
app.set('view engine', 'hbs') 

var context = {
    table_headers: ['id', 'obraz', 'name', 'size', 'type', '-', '-', '-'],
    supported_file_types: ['jpeg', 'jpg', 'pdf', 'png', 'rar', 'txt'],
    files: []
}

app.get("/", function (req, res) {
    res.render('upload.hbs', context)
})

app.post('/handleUpload', function (req, res) {
    var form = new formidable.IncomingForm()
    form.uploadDir = __dirname + '/static/upload/' 
    form.keepExtensions = true        
    form.multiples = true                              
    form.parse(req, function (err, fields, files) {
        function createEntry(element) {
            let obraz
            if (context.supported_file_types.includes(`${element.name.split('.')[element.name.split('.').length - 1].toLowerCase()}`) == true) {
                obraz = `${element.name.split('.')[element.name.split('.').length - 1].toLowerCase()}`
            } else {
                obraz = 'inne'
            }
            let id
            if (context.files.length == 0) {
                id = 1
            } else {
                id = context.files[context.files.length - 1].id + 1
            }

            context.files.push({
                id: id,
                obraz: obraz,
                name: element.name,
                size: element.size,
                type: element.type,
                delete: `/delete/?id=${id}`,
                info: `/info/?id=${id}`,
                download: `/download/?id=${id}`,
                path: element.path,
                savedate: Date.now(),
            })
        }

        if (Array.isArray(files.imagetoupload) == true) { 
            for (element of files.imagetoupload) {
                createEntry(element)
            }
        } else { 

            createEntry(files.imagetoupload)
        }
        res.redirect('/filemanager')
    })
})

app.get("/filemanager", function (req, res) {
    res.render('filemanager.hbs', context)   
})

app.get("/info", function (req, res) {
    let result = context.files.filter(element => (element.id == parseInt(req.query.id)))[0]
    let context_new
    if (result != undefined) {
        context_new = {
            entry: {
                id: result.id,
                name: result.name,
                path: result.path,
                size: result.size,
                type: result.type,
                savedate: result.savedate,
            }
        }
    }
    res.render('info.hbs', context_new)    
})

app.get("/reset", function (req, res) {
    context.files = []
    res.redirect('/filemanager')
})

app.get("/delete", function (req, res) {
    let result = context.files.filter(element => (element.id != parseInt(req.query.id)))
    context.files = result
    res.redirect('/filemanager')
})

app.get("/download", function (req, res) {
    let result = context.files.filter(element => (element.id == parseInt(req.query.id)))[0]
    res.download(result.path)
})


app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
    console.log("ścieżka do katalogu głównego aplikacji: " + __dirname)
})
