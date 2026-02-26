import multer from 'multer';

// Configure multer storage 
// This will save the uploaded files to the "uploads" directory inside "public"
const storage =multer.diskStorage({
    destination: function (req,file,cb){
        cb(null,"./public/temp")
    },

    filename: function (req,file,cb){
        cb(null,file.originalname)
    }
    
})
export const upload = multer({
    storage,
})
