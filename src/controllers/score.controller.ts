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
import fetch from "node-fetch";

@Controller("/scores")
export class ScoreController {
  private readonly users = Users;
  private readonly scores = Scores;

  /**
   * GotScores
   */
  @Get("/")
  public async GotScores(req: Request, res: Response): Promise<Response> {
    const { limit } = req.query;
    try {
      const data = await this.scores.findAll({
        include: [{ model: Users, as: "player", attributes: ["fullname", "phone_number", "agency", "role"] }],
        order: [["score", "DESC"]],
        limit: limit ? parseInt(`${limit}`) : 200,
      });

      return res.status(200).send({ statusCode: 200, msg: "OK", data: data });
    } catch (err) {
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err });
      return res.status(500).send({ statusCode: res.statusCode, msg: "Something went wrong!" });
    }
  }

  /**
   * CreateWithIntegration
   */
  @Post("/create-or-update-with-integration")
  public async CreateWithIntegration(req: Request, res: Response): Promise<Response> {
    const t = await sequelize.transaction();
    try {
      if (req.body.session !== `${process.env.HASH}`) throw { statusCode: 403, err: "request forbiden!" };
      const _gotUser = await this.GotUserFromGuestBook(req.body.phone_number);
      Object.assign(_gotUser, { ..._gotUser, score: req.body.score });
      const errors = await validate(_gotUser);
      if (errors.length > 0) return res.status(422).send({ statusCode: res.statusCode, msg: "!OK", err: errors });

      const _User = await this.CreateOrUpdateUser(_gotUser, t);
      const _Score = await this.CreateOrUpdateScore(_User.id, _gotUser.score, t);
      const data = this.SerializeResponseCreate(_User, _Score);
      t.commit();
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data });
    } catch (err) {
      t.rollback();
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err });
      return res.status(500).send({ statusCode: res.statusCode, msg: "Something went wrong!" });
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
      if (req.body.session !== `${process.env.HASH}`) throw { statusCode: 403, err: "request forbiden!" };
      //check user already or now
      const _User = await this.CreateOrUpdateUser(payload, t);
      const _Score = await this.CreateOrUpdateScore(_User.id, payload.score, t);
      const data = this.SerializeResponseCreate(_User, _Score);
      t.commit();
      return res.status(200).send({ statusCode: 200, msg: "OK", data: data });
    } catch (err) {
      t.rollback();
      if (err.statusCode)
        return res.status(err.statusCode).send({ statusCode: err.statusCode, msg: "!OK", err: err.err });
      return res.status(500).send({ statusCode: res.statusCode, msg: "Something went wrong!" });
    }
  }

  private SerializeResponseCreate(user: Users, score: Scores) {
    const data = {
      id: score.id,
      user_id: score.user_id,
      score: score.score,
      created_at: score.created_at,
      updated_at: score.updated_at,
      player: {
        fullname: user.fullname,
        phone_number: user.phone_number,
        agency: user.agency,
        role: user.role,
      },
    };
    return data;
  }

  private async GotUserFromGuestBook(phone_number: string) {
    return await fetch(`https://api.bbraun.unibase.id/api/user/${phone_number}`, { method: "GET" })
      .then((res) => res.json())
      .then((r) => {
        if (r?.statusCode === 200) {
          if (r.data == null) throw { statusCode: 404, err: "user not found!" };
          const response = r.data;
          const _user: ScoreCreateOrUpdateDto = {
            fullname: (response.nama as string).toLowerCase(),
            phone_number: response.no_telepon,
            agency: (response.instansi as string).toLowerCase(),
            role: (response.bagian as string).toLowerCase(),
            score: 0,
          };
          return _user;
        }
        if (r.statusCode === 404) throw { statusCode: 404, err: "user not found!" };
        throw { statusCode: 500, err: "something went wrong!" };
      })
      .catch((err) => {
        if (err.statusCode) throw { statusCode: err.statusCode, err: err.err };
        throw { statusCode: 500, err: "something went wrong!" };
      });
  }

  private async CreateOrUpdateUser(payload: ScoreCreateOrUpdateDto, t: Transaction): Promise<Users> {
    try {
      const _findOneUser = await this.users.findOne({
        where: {
          [Op.or]: [{ phone_number: payload.phone_number }],
        },
        transaction: t,
      });

      //update user
      if (_findOneUser !== null) {
        await this.users.update(
          {
            fullname: payload.fullname,
            phone_number: payload.phone_number,
            agency: payload.agency,
            role: payload.role,
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
          phone_number: payload.phone_number,
          agency: payload.agency,
          role: payload.role,
        },
        { transaction: t }
      );

      return _newUser;
    } catch (error) {
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
      throw { statusCode: 500, err: "something went wrong!" };
    }
  }
}

export default ScoreController;
