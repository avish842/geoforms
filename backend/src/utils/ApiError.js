class ApiError extends Error {
    constructor(
        statusCode,
        message="Somthing went wrong ",
        errors=[],
        stack=""// this is used to store the stack trace of the error
    ){
        super(message)
        this.statusCode=statusCode,
        this.data= null , // this is used to store the data related to the error
        this.errors =errors,
        this.message=message,
        this.success=false

        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this, this.constructor) // this is used to capture the stack trace of the error
        }
    }
}

export {ApiError}
