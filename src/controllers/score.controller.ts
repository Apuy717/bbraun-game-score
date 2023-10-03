import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import sequelize from "../config/sequelize";
import { ScoreCreateOrUpdateDto } from "../models/score.create.or.update";
import Scores from "../models/scores.model";
import Users from "../models/users";
import Controller from "../utils/decorators/controller.decorator";
import { Get, Post } from "../utils/decorators/handler.decorator";

@Controller("/scores")
export class ScoreController {
  private readonly users = Users;
  private readonly scores = Scores;

  /**
   * GotScores
   */
  @Get("/")
  public async GotScores(req: Request, res: Response): Promise<Response> {
    try {
      const data = await this.scores.findAll({
        include: [{ model: Users, as: "player", attributes: ["fullname", "dial_code", "phone_number", "email"] }],
        order: [["score", "DESC"]],
      });

      return res.status(200).send({ statusCode: 200, msg: "OK", data: data });
    } catch (error) {
      console.log(error);

      return res.status(500).send({ statusCode: 500, msg: "Something went wrong!" });
    }
  }

  /**
   * CreateOrUpdate
   */
  @Post("/create-or-update")
  public async CreateOrUpdate(req: Request, res: Response): Promise<Response> {
    const payload = plainToClass(ScoreCreateOrUpdateDto, req.body);
    const errors = await validate(payload);
    if (errors.length > 0) return res.status(422).send({ statusCode: res.statusCode, msg: "!OK", err: errors });
    const t = await sequelize.transaction();
    try {
      //check user already or now
      const _User = await this.CreateOrUpdateUser(payload, t);
      const _Score = await this.CreateOrUpdateScore(_User.id, payload.scores, t);
      const data = {
        user: _User,
        score: _Score,
      };
      t.commit();
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data });
    } catch (error) {
      console.log(error);
      t.rollback();
      return res.status(500).send({ statusCode: 500, msg: "Something went wrong!" });
    }
  }

  private async CreateOrUpdateUser(payload: ScoreCreateOrUpdateDto, t: Transaction): Promise<Users> {
    try {
      const _findOneUser = await this.users.findOne({
        where: {
          [Op.or]: [{ email: payload.email }, { phone_number: payload.phone_number }],
        },
        transaction: t,
      });
      //update user
      if (_findOneUser !== null) {
        await this.users.update(
          {
            fullname: payload.fullname,
            dial_code: payload.dial_code,
            phone_number: payload.phone_number,
            email: payload.email,
          },
          { where: { id: _findOneUser.id }, transaction: t }
        );
        //return new user
        const _newUser = await this.users.findOne({ where: { id: _findOneUser.id }, transaction: t });
        return _newUser;
      }

      //create new user
      const _newUser = await this.users.create(
        {
          fullname: payload.fullname,
          dial_code: payload.dial_code,
          phone_number: payload.phone_number,
          email: payload.email,
        },
        { transaction: t }
      );

      return _newUser;
    } catch (error) {
      console.log("create user error : ", error);
      throw { statusCode: 500, err: "something went wrong!" };
    }
  }

  private async CreateOrUpdateScore(user_id: string | null, score: number, t: Transaction): Promise<Scores> {
    try {
      const _findScores = await this.scores.findOne({ where: { user_id: user_id }, transaction: t });
      if (_findScores !== null) {
        //do nothing if the score is smaller than the previous score
        if (_findScores.score > score) {
          return _findScores;
        }

        //update the score if it is greater than the previous score
        await this.scores.update({ score: score }, { where: { user_id: user_id }, transaction: t });
        const _newScore = await this.scores.findOne({ where: { user_id: user_id }, transaction: t });
        return _newScore;
      }

      const _newScore = await this.scores.create({ user_id: user_id, score: score }, { transaction: t });
      return _newScore;
    } catch (error) {
      console.log("create score error : ", error);
      throw { statusCode: 500, err: "something went wrong!" };
    }
  }
}

export default ScoreController;
