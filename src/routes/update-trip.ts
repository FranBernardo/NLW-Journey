import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import nodemailer from "nodemailer";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../error/client.error";

export async function updateTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/trips/:tripId",
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
        }),
      },
    },
    async (req) => {
      const { tripId } = req.params;
      const { destination, ends_at, starts_at } = req.body;

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new ClientError("Invalid trip start date");
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new ClientError("Invalid trip start date");
      }

      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
      });

      if (!trip) {
        throw new ClientError("Trip not found");
      }

      await prisma.trip.update({
        where: { id: tripId },
        data: {
          destination,
          starts_at,
          ends_at,
        },
      })
      
      return {
        tripId: trip.id,
      };
    }
  );
}
