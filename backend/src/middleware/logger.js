export function logger(request, _response, next) { console.log(request.method, request.path); next(); }
