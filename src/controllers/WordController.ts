import { NextFunction, Request, Response } from "express";
import { scrapeTermania, Pagination } from "../helpers/scrape/TermaniaScrape";
export namespace WordController {
  export async function singleResult(req: Request, res: Response) {
    // If page param is not a number, set page value to 1 (the first page).
    const pageParam = Number(req.params.page);
    const page = Number.isNaN(pageParam) ? 1 : pageParam;

    const word = req.params.word;

    scrapeTermania(word, page)
      .then((value) => {
        res.json(value);
      })
      .catch((error) => {
        return res.json(error);
      });
    // if (page === null) {
    //   console.log("LOL");
    // }
    // return res.json({
    //     // scrapeTermania(word, page)
    // });
    //     const user = new UserModel({
    //       email: req.body.email,
    //       firstName: req.body.firstname,
    //       lastName: req.body.lastname,
    //       phoneNumber: req.body.phonenumber,
    //       username: req.body.username,
    //       password: req.body.password,
    //     });
    //     try {
    //       let takenUsername = await UserModel.findOne({
    //         username: req.body.username,
    //       });
    //       if (!takenUsername) {
    //         console.log("saving user");
    //         user.save();
    //         return res.status(201).json(user);
    //       } else {
    //         return res.json("Username is taken");
    //       }
    //     } catch (err) {
    //       return res.status(500).json({
    //         message: "Error when creating user",
    //         error: err,
    //       });
    //     }
  }
}

export default WordController;
