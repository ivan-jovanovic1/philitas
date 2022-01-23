class IndexController {
    static async showHomePage(req, res){
    //    req.session.user = "ivan";
        return res.render('index', {session: req.session.user});    
    }
}

export default IndexController;