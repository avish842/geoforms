const asyncHandler=(requestHandler)=>{

    return  (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).// Promise.resolve is used to ensure that the requestHandler is executed as a promise
        catch((err)=>next(err))// Pass the error to the next middleware ,use of the next is important to handle the error in the express app
    }
}


export {asyncHandler}